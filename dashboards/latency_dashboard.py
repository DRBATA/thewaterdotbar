"""
🚀 Water Bar Voice AI - Latency Benchmarking Dashboard

Real-time visualization of latency improvements across optimization stages.
Run with: streamlit run dashboards/latency_dashboard.py
"""

import streamlit as st
import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime, timedelta
import numpy as np
import json
import os
from pathlib import Path

# Page config
st.set_page_config(
    page_title="🚀 Water Bar Latency Dashboard",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .metric-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
        border-radius: 10px;
        color: white;
        margin: 0.5rem 0;
    }
    .improvement-positive {
        color: #00ff00;
        font-weight: bold;
    }
    .improvement-negative {
        color: #ff4444;
        font-weight: bold;
    }
    .stage-header {
        background: linear-gradient(90deg, #14b8a6, #a855f7, #eab308);
        padding: 1rem;
        border-radius: 10px;
        color: white;
        text-align: center;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

class LatencyDashboard:
    def __init__(self):
        self.data_file = "dashboards/latency_data.json"
        self.ensure_data_file()
    
    def ensure_data_file(self):
        """Create sample data file if it doesn't exist"""
        if not os.path.exists(self.data_file):
            os.makedirs("dashboards", exist_ok=True)
            sample_data = self.generate_sample_data()
            with open(self.data_file, 'w') as f:
                json.dump(sample_data, f, indent=2)
    
    def generate_sample_data(self):
        """Generate realistic sample data for demonstration"""
        base_time = datetime.now() - timedelta(days=7)
        data = []
        
        # Stage progression with realistic improvements
        stages = [
            {"name": "Baseline", "asr": 500, "ack": 800, "full": 2200, "completeness": 60},
            {"name": "Stage 1", "asr": 420, "ack": 650, "full": 1900, "completeness": 85},
            {"name": "Stage 2", "asr": 280, "ack": 380, "full": 1450, "completeness": 95},
            {"name": "Stage 3", "asr": 150, "ack": 220, "full": 400, "completeness": 99}
        ]
        
        for i, stage in enumerate(stages):
            for hour in range(24):
                timestamp = base_time + timedelta(days=i*2, hours=hour)
                
                # Add realistic variance
                asr_variance = np.random.normal(0, stage["asr"] * 0.1)
                ack_variance = np.random.normal(0, stage["ack"] * 0.1)
                full_variance = np.random.normal(0, stage["full"] * 0.1)
                
                data.append({
                    "timestamp": timestamp.isoformat(),
                    "stage": stage["name"],
                    "asr_latency_ms": max(50, stage["asr"] + asr_variance),
                    "ack_latency_ms": max(100, stage["ack"] + ack_variance),
                    "full_latency_ms": max(200, stage["full"] + full_variance),
                    "framework_completeness": min(100, max(0, stage["completeness"] + np.random.normal(0, 5))),
                    "audio_quality_wer": max(0.05, 0.25 - (i * 0.05) + np.random.normal(0, 0.02)),
                    "cost_per_interaction": max(0.01, 0.15 - (i * 0.03) + np.random.normal(0, 0.01))
                })
        
        return data
    
    def load_data(self):
        """Load latency data from JSON file"""
        try:
            with open(self.data_file, 'r') as f:
                data = json.load(f)
            df = pd.DataFrame(data)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            return df
        except Exception as e:
            st.error(f"Error loading data: {e}")
            return pd.DataFrame()
    
    def add_real_time_data(self, stage, asr_ms, ack_ms, full_ms, completeness, wer, cost):
        """Add new real-time measurement"""
        try:
            with open(self.data_file, 'r') as f:
                data = json.load(f)
            
            new_entry = {
                "timestamp": datetime.now().isoformat(),
                "stage": stage,
                "asr_latency_ms": asr_ms,
                "ack_latency_ms": ack_ms,
                "full_latency_ms": full_ms,
                "framework_completeness": completeness,
                "audio_quality_wer": wer,
                "cost_per_interaction": cost
            }
            
            data.append(new_entry)
            
            with open(self.data_file, 'w') as f:
                json.dump(data, f, indent=2)
            
            return True
        except Exception as e:
            st.error(f"Error adding data: {e}")
            return False

def main():
    dashboard = LatencyDashboard()
    
    # Header
    st.markdown("""
    <div class="stage-header">
        <h1>🚀 Water Bar Voice AI - Latency Optimization Dashboard</h1>
        <p>Real-time benchmarking and visualization of performance improvements</p>
    </div>
    """, unsafe_allow_html=True)
    
    # Sidebar controls
    st.sidebar.header("🎛️ Dashboard Controls")
    
    # Stage selector
    current_stage = st.sidebar.selectbox(
        "Current Optimization Stage",
        ["Baseline", "Stage 1", "Stage 2", "Stage 3"],
        index=1
    )
    
    # Real-time data input
    st.sidebar.subheader("📊 Add Real-Time Measurement")
    with st.sidebar.form("add_measurement"):
        asr_input = st.number_input("ASR Latency (ms)", min_value=50, max_value=1000, value=400)
        ack_input = st.number_input("ACK Latency (ms)", min_value=100, max_value=2000, value=600)
        full_input = st.number_input("Full Latency (ms)", min_value=200, max_value=5000, value=1800)
        completeness_input = st.slider("Framework Completeness (%)", 0, 100, 85)
        wer_input = st.number_input("Word Error Rate", min_value=0.0, max_value=1.0, value=0.15, step=0.01)
        cost_input = st.number_input("Cost per Interaction ($)", min_value=0.0, max_value=1.0, value=0.12, step=0.01)
        
        if st.form_submit_button("📈 Add Measurement"):
            if dashboard.add_real_time_data(current_stage, asr_input, ack_input, full_input, 
                                          completeness_input, wer_input, cost_input):
                st.sidebar.success("✅ Measurement added!")
                st.experimental_rerun()
    
    # Load data
    df = dashboard.load_data()
    
    if df.empty:
        st.error("No data available. Please check the data file.")
        return
    
    # Main dashboard layout
    col1, col2, col3, col4 = st.columns(4)
    
    # Current stage metrics
    current_data = df[df['stage'] == current_stage].tail(10).mean()
    baseline_data = df[df['stage'] == 'Baseline'].mean()
    
    with col1:
        asr_improvement = ((baseline_data['asr_latency_ms'] - current_data['asr_latency_ms']) / baseline_data['asr_latency_ms']) * 100
        st.metric(
            "🎤 ASR Latency",
            f"{current_data['asr_latency_ms']:.0f}ms",
            f"{asr_improvement:+.1f}%"
        )
    
    with col2:
        ack_improvement = ((baseline_data['ack_latency_ms'] - current_data['ack_latency_ms']) / baseline_data['ack_latency_ms']) * 100
        st.metric(
            "⚡ Fast-ACK",
            f"{current_data['ack_latency_ms']:.0f}ms",
            f"{ack_improvement:+.1f}%"
        )
    
    with col3:
        full_improvement = ((baseline_data['full_latency_ms'] - current_data['full_latency_ms']) / baseline_data['full_latency_ms']) * 100
        st.metric(
            "🧠 Full Plan",
            f"{current_data['full_latency_ms']:.0f}ms",
            f"{full_improvement:+.1f}%"
        )
    
    with col4:
        completeness_improvement = current_data['framework_completeness'] - baseline_data['framework_completeness']
        st.metric(
            "✅ Completeness",
            f"{current_data['framework_completeness']:.1f}%",
            f"{completeness_improvement:+.1f}%"
        )
    
    # Main charts
    st.subheader("📈 Latency Trends Over Time")
    
    # Create tabs for different views
    tab1, tab2, tab3, tab4 = st.tabs(["🎯 Main Latencies", "📊 Stage Comparison", "🎵 Audio Quality", "💰 Cost Analysis"])
    
    with tab1:
        # Main latency chart
        fig = go.Figure()
        
        for stage in df['stage'].unique():
            stage_data = df[df['stage'] == stage]
            
            fig.add_trace(go.Scatter(
                x=stage_data['timestamp'],
                y=stage_data['asr_latency_ms'],
                name=f"{stage} - ASR",
                line=dict(width=2),
                mode='lines+markers'
            ))
            
            fig.add_trace(go.Scatter(
                x=stage_data['timestamp'],
                y=stage_data['ack_latency_ms'],
                name=f"{stage} - ACK",
                line=dict(width=2, dash='dash'),
                mode='lines+markers'
            ))
            
            fig.add_trace(go.Scatter(
                x=stage_data['timestamp'],
                y=stage_data['full_latency_ms'],
                name=f"{stage} - Full",
                line=dict(width=2, dash='dot'),
                mode='lines+markers'
            ))
        
        fig.update_layout(
            title="Latency Improvements Across Optimization Stages",
            xaxis_title="Time",
            yaxis_title="Latency (ms)",
            height=500,
            hovermode='x unified'
        )
        
        st.plotly_chart(fig, use_container_width=True)
    
    with tab2:
        # Stage comparison
        stage_summary = df.groupby('stage').agg({
            'asr_latency_ms': 'mean',
            'ack_latency_ms': 'mean',
            'full_latency_ms': 'mean',
            'framework_completeness': 'mean'
        }).reset_index()
        
        fig_bar = go.Figure()
        
        fig_bar.add_trace(go.Bar(
            name='ASR Latency',
            x=stage_summary['stage'],
            y=stage_summary['asr_latency_ms'],
            marker_color='#14b8a6'
        ))
        
        fig_bar.add_trace(go.Bar(
            name='ACK Latency',
            x=stage_summary['stage'],
            y=stage_summary['ack_latency_ms'],
            marker_color='#a855f7'
        ))
        
        fig_bar.add_trace(go.Bar(
            name='Full Latency',
            x=stage_summary['stage'],
            y=stage_summary['full_latency_ms'],
            marker_color='#eab308'
        ))
        
        fig_bar.update_layout(
            title="Average Latency by Optimization Stage",
            xaxis_title="Stage",
            yaxis_title="Latency (ms)",
            height=500,
            barmode='group'
        )
        
        st.plotly_chart(fig_bar, use_container_width=True)
        
        # Improvement table
        st.subheader("📋 Stage-by-Stage Improvements")
        improvement_df = stage_summary.copy()
        baseline_row = improvement_df[improvement_df['stage'] == 'Baseline'].iloc[0]
        
        for col in ['asr_latency_ms', 'ack_latency_ms', 'full_latency_ms']:
            improvement_df[f'{col}_improvement'] = ((baseline_row[col] - improvement_df[col]) / baseline_row[col] * 100).round(1)
        
        st.dataframe(improvement_df, use_container_width=True)
    
    with tab3:
        # Audio quality metrics
        fig_audio = go.Figure()
        
        for stage in df['stage'].unique():
            stage_data = df[df['stage'] == stage]
            
            fig_audio.add_trace(go.Scatter(
                x=stage_data['timestamp'],
                y=stage_data['audio_quality_wer'],
                name=f"{stage} - WER",
                line=dict(width=2),
                mode='lines+markers'
            ))
        
        fig_audio.update_layout(
            title="Audio Quality (Word Error Rate) Over Time",
            xaxis_title="Time",
            yaxis_title="Word Error Rate",
            height=400
        )
        
        st.plotly_chart(fig_audio, use_container_width=True)
    
    with tab4:
        # Cost analysis
        fig_cost = go.Figure()
        
        for stage in df['stage'].unique():
            stage_data = df[df['stage'] == stage]
            
            fig_cost.add_trace(go.Scatter(
                x=stage_data['timestamp'],
                y=stage_data['cost_per_interaction'],
                name=f"{stage} - Cost",
                line=dict(width=2),
                mode='lines+markers'
            ))
        
        fig_cost.update_layout(
            title="Cost per Interaction Over Time",
            xaxis_title="Time",
            yaxis_title="Cost ($)",
            height=400
        )
        
        st.plotly_chart(fig_cost, use_container_width=True)
        
        # Cost summary
        cost_summary = df.groupby('stage')['cost_per_interaction'].mean().reset_index()
        st.subheader("💰 Cost Summary by Stage")
        st.dataframe(cost_summary, use_container_width=True)
    
    # Target achievement
    st.subheader("🎯 Target Achievement")
    
    targets = {
        "ASR Latency": {"current": current_data['asr_latency_ms'], "target": 100},
        "ACK Latency": {"current": current_data['ack_latency_ms'], "target": 250},
        "Full Latency": {"current": current_data['full_latency_ms'], "target": 250},
        "Framework Completeness": {"current": current_data['framework_completeness'], "target": 99}
    }
    
    progress_cols = st.columns(4)
    
    for i, (metric, values) in enumerate(targets.items()):
        with progress_cols[i]:
            if "Latency" in metric:
                # For latency, lower is better
                progress = max(0, min(100, (1000 - values["current"]) / (1000 - values["target"]) * 100))
            else:
                # For completeness, higher is better
                progress = min(100, values["current"] / values["target"] * 100)
            
            st.metric(metric, f"{values['current']:.0f}", f"Target: {values['target']}")
            st.progress(progress / 100)

if __name__ == "__main__":
    main()
