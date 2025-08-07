"""
Enhanced Telemetry System with multiple backends and detailed metrics tracking.
Supports StatsD, Prometheus, and local CSV export for comprehensive monitoring.
"""

import time
import json
import csv
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from pathlib import Path
import threading
from queue import Queue
import asyncio

try:
    import statsd
    STATSD_AVAILABLE = True
except ImportError:
    STATSD_AVAILABLE = False

try:
    from prometheus_client import Counter, Histogram, Gauge, push_to_gateway
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False

@dataclass
class MetricEvent:
    """Single metric event with metadata"""
    timestamp: float
    metric_type: str  # 'timing', 'counter', 'gauge'
    name: str
    value: float
    tags: Dict[str, str]
    session_id: Optional[str] = None

class EnhancedTelemetry:
    """Multi-backend telemetry system with local storage and export capabilities."""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or {}
        
        # Initialize backends
        self.statsd_client = None
        self.prometheus_metrics = {}
        self.local_storage = Queue()
        
        # Storage configuration
        self.csv_file = Path(self.config.get('csv_file', 'metrics/latency.csv'))
        self.json_file = Path(self.config.get('json_file', 'metrics/events.json'))
        
        # Ensure directories exist
        self.csv_file.parent.mkdir(parents=True, exist_ok=True)
        self.json_file.parent.mkdir(parents=True, exist_ok=True)
        
        # Initialize backends
        self._init_statsd()
        self._init_prometheus()
        
        # Start background writer
        self._start_background_writer()
        
        # Performance tracking
        self.session_metrics: Dict[str, List[MetricEvent]] = {}
        self.aggregated_metrics: Dict[str, Dict[str, float]] = {}
    
    def _init_statsd(self):
        """Initialize StatsD client if available and configured."""
        if not STATSD_AVAILABLE:
            return
        
        statsd_config = self.config.get('statsd', {})
        if statsd_config.get('enabled', True):
            try:
                self.statsd_client = statsd.StatsClient(
                    host=statsd_config.get('host', 'localhost'),
                    port=statsd_config.get('port', 8125),
                    prefix=statsd_config.get('prefix', 'waterbar.agent')
                )
            except Exception as e:
                print(f"Failed to initialize StatsD: {e}")
    
    def _init_prometheus(self):
        """Initialize Prometheus metrics if available."""
        if not PROMETHEUS_AVAILABLE:
            return
        
        # Define Prometheus metrics
        self.prometheus_metrics = {
            'latency_histogram': Histogram(
                'waterbar_agent_latency_seconds',
                'Processing latency in seconds',
                ['stage', 'session_id']
            ),
            'request_counter': Counter(
                'waterbar_agent_requests_total',
                'Total number of requests',
                ['type', 'status']
            ),
            'active_sessions': Gauge(
                'waterbar_agent_active_sessions',
                'Number of active sessions'
            )
        }
    
    def timing(self, name: str, value: float, tags: Dict[str, str] = None, session_id: str = None):
        """Record timing metric in milliseconds."""
        tags = tags or {}
        
        # Create metric event
        event = MetricEvent(
            timestamp=time.time(),
            metric_type='timing',
            name=name,
            value=value,
            tags=tags,
            session_id=session_id
        )
        
        # Send to backends
        self._send_to_backends(event)
        
        # Store locally
        self.local_storage.put(event)
        self._store_session_metric(session_id, event)
    
    def increment(self, name: str, value: int = 1, tags: Dict[str, str] = None, session_id: str = None):
        """Increment counter metric."""
        tags = tags or {}
        
        event = MetricEvent(
            timestamp=time.time(),
            metric_type='counter',
            name=name,
            value=value,
            tags=tags,
            session_id=session_id
        )
        
        self._send_to_backends(event)
        self.local_storage.put(event)
        self._store_session_metric(session_id, event)
    
    def gauge(self, name: str, value: float, tags: Dict[str, str] = None, session_id: str = None):
        """Set gauge metric value."""
        tags = tags or {}
        
        event = MetricEvent(
            timestamp=time.time(),
            metric_type='gauge',
            name=name,
            value=value,
            tags=tags,
            session_id=session_id
        )
        
        self._send_to_backends(event)
        self.local_storage.put(event)
        self._store_session_metric(session_id, event)
    
    def _send_to_backends(self, event: MetricEvent):
        """Send metric to all configured backends."""
        
        # StatsD backend
        if self.statsd_client:
            try:
                if event.metric_type == 'timing':
                    self.statsd_client.timing(event.name, event.value)
                elif event.metric_type == 'counter':
                    self.statsd_client.incr(event.name, event.value)
                elif event.metric_type == 'gauge':
                    self.statsd_client.gauge(event.name, event.value)
            except Exception as e:
                print(f"StatsD error: {e}")
        
        # Prometheus backend
        if self.prometheus_metrics:
            try:
                if event.metric_type == 'timing' and 'latency_histogram' in self.prometheus_metrics:
                    # Convert ms to seconds for Prometheus
                    self.prometheus_metrics['latency_histogram'].labels(
                        stage=event.tags.get('stage', 'unknown'),
                        session_id=event.session_id or 'unknown'
                    ).observe(event.value / 1000.0)
                
                elif event.metric_type == 'counter' and 'request_counter' in self.prometheus_metrics:
                    self.prometheus_metrics['request_counter'].labels(
                        type=event.tags.get('type', 'unknown'),
                        status=event.tags.get('status', 'success')
                    ).inc(event.value)
                
                elif event.metric_type == 'gauge' and event.name == 'active_sessions':
                    self.prometheus_metrics['active_sessions'].set(event.value)
                    
            except Exception as e:
                print(f"Prometheus error: {e}")
    
    def _store_session_metric(self, session_id: str, event: MetricEvent):
        """Store metric for session-specific analysis."""
        if not session_id:
            return
        
        if session_id not in self.session_metrics:
            self.session_metrics[session_id] = []
        
        self.session_metrics[session_id].append(event)
        
        # Keep only recent metrics per session (last 100)
        if len(self.session_metrics[session_id]) > 100:
            self.session_metrics[session_id] = self.session_metrics[session_id][-100:]
    
    def _start_background_writer(self):
        """Start background thread for writing metrics to files."""
        def writer_thread():
            batch = []
            while True:
                try:
                    # Collect batch of metrics
                    while len(batch) < 10:
                        try:
                            event = self.local_storage.get(timeout=5.0)
                            batch.append(event)
                        except:
                            break
                    
                    if batch:
                        self._write_batch_to_files(batch)
                        batch.clear()
                        
                except Exception as e:
                    print(f"Telemetry writer error: {e}")
                    time.sleep(1)
        
        writer = threading.Thread(target=writer_thread, daemon=True)
        writer.start()
    
    def _write_batch_to_files(self, events: List[MetricEvent]):
        """Write batch of events to CSV and JSON files."""
        
        # Write to CSV (for dashboard compatibility)
        csv_exists = self.csv_file.exists()
        
        with open(self.csv_file, 'a', newline='') as f:
            writer = csv.writer(f)
            
            # Write header if file is new
            if not csv_exists:
                writer.writerow([
                    'timestamp', 'metric_type', 'name', 'value', 
                    'session_id', 'tags_json'
                ])
            
            # Write events
            for event in events:
                writer.writerow([
                    event.timestamp,
                    event.metric_type,
                    event.name,
                    event.value,
                    event.session_id or '',
                    json.dumps(event.tags)
                ])
        
        # Write to JSON (for detailed analysis)
        json_events = []
        if self.json_file.exists():
            try:
                with open(self.json_file, 'r') as f:
                    json_events = json.load(f)
            except:
                json_events = []
        
        # Add new events
        for event in events:
            json_events.append(asdict(event))
        
        # Keep only recent events (last 1000)
        if len(json_events) > 1000:
            json_events = json_events[-1000:]
        
        with open(self.json_file, 'w') as f:
            json.dump(json_events, f, indent=2)
    
    def get_session_summary(self, session_id: str) -> Dict[str, Any]:
        """Get performance summary for a specific session."""
        if session_id not in self.session_metrics:
            return {'error': 'Session not found'}
        
        events = self.session_metrics[session_id]
        
        # Calculate summary statistics
        timings = [e for e in events if e.metric_type == 'timing']
        counters = [e for e in events if e.metric_type == 'counter']
        
        summary = {
            'session_id': session_id,
            'total_events': len(events),
            'duration_seconds': 0,
            'timing_stats': {},
            'counter_totals': {},
            'performance_score': 0.0
        }
        
        if events:
            summary['duration_seconds'] = events[-1].timestamp - events[0].timestamp
        
        # Timing statistics
        timing_groups = {}
        for event in timings:
            if event.name not in timing_groups:
                timing_groups[event.name] = []
            timing_groups[event.name].append(event.value)
        
        for name, values in timing_groups.items():
            summary['timing_stats'][name] = {
                'count': len(values),
                'avg_ms': sum(values) / len(values),
                'min_ms': min(values),
                'max_ms': max(values),
                'p95_ms': sorted(values)[int(len(values) * 0.95)] if len(values) > 1 else values[0]
            }
        
        # Counter totals
        counter_groups = {}
        for event in counters:
            counter_groups[event.name] = counter_groups.get(event.name, 0) + event.value
        summary['counter_totals'] = counter_groups
        
        # Calculate performance score
        summary['performance_score'] = self._calculate_performance_score(summary)
        
        return summary
    
    def _calculate_performance_score(self, summary: Dict[str, Any]) -> float:
        """Calculate overall performance score (0-1) for a session."""
        score = 1.0
        
        # Penalize high latencies
        timing_stats = summary.get('timing_stats', {})
        
        for name, stats in timing_stats.items():
            avg_ms = stats['avg_ms']
            
            # Define target latencies
            targets = {
                'asr_latency_ms': 300,
                'ack_latency_ms': 500,
                'full_latency_ms': 2000,
                'total_processing_ms': 3000
            }
            
            target = targets.get(name, 1000)
            if avg_ms > target:
                penalty = min(0.5, (avg_ms - target) / target)
                score -= penalty * 0.2  # Max 20% penalty per metric
        
        # Bonus for low error rates
        counter_totals = summary.get('counter_totals', {})
        errors = sum(count for name, count in counter_totals.items() if 'error' in name)
        total_requests = sum(counter_totals.values())
        
        if total_requests > 0:
            error_rate = errors / total_requests
            score -= error_rate * 0.3  # Up to 30% penalty for errors
        
        return max(0.0, min(1.0, score))
    
    def export_dashboard_data(self) -> Dict[str, Any]:
        """Export data in format suitable for dashboard consumption."""
        
        # Read recent events from JSON
        events = []
        if self.json_file.exists():
            try:
                with open(self.json_file, 'r') as f:
                    events = json.load(f)
            except:
                pass
        
        # Group by session and time
        dashboard_data = {
            'sessions': {},
            'aggregated': {
                'total_events': len(events),
                'unique_sessions': len(set(e.get('session_id') for e in events if e.get('session_id'))),
                'avg_latencies': {},
                'error_rates': {}
            },
            'recent_events': events[-50:] if events else []
        }
        
        # Calculate aggregated metrics
        timing_events = [e for e in events if e.get('metric_type') == 'timing']
        
        timing_groups = {}
        for event in timing_events:
            name = event.get('name', 'unknown')
            if name not in timing_groups:
                timing_groups[name] = []
            timing_groups[name].append(event.get('value', 0))
        
        for name, values in timing_groups.items():
            if values:
                dashboard_data['aggregated']['avg_latencies'][name] = sum(values) / len(values)
        
        return dashboard_data
    
    def flush(self):
        """Flush all pending metrics to storage."""
        batch = []
        while not self.local_storage.empty():
            try:
                batch.append(self.local_storage.get_nowait())
            except:
                break
        
        if batch:
            self._write_batch_to_files(batch)

# Global telemetry instance
_telemetry_instance = None

def get_telemetry(config: Dict[str, Any] = None) -> EnhancedTelemetry:
    """Get global telemetry instance."""
    global _telemetry_instance
    if _telemetry_instance is None:
        _telemetry_instance = EnhancedTelemetry(config)
    return _telemetry_instance

# Backward compatibility with original simple interface
stats = get_telemetry()
