# 🚀 LATENCY OPTIMIZATION PLAN
## Water Bar Voice AI Agent - Performance Enhancement Roadmap

### **Current Baseline (Before Optimization)**
| Metric | Current Performance | Target Performance |
|--------|-------------------|-------------------|
| ASR First Partial | 450-550ms | 100ms |
| Fast-ACK Response | 700-900ms | 250ms |
| Full Plan Delivery | 2000-2500ms | 250ms |

---

## **🎯 3-Stage Optimization Strategy**

Each stage addresses all three pillars:
1. **Sound Optimization** - Better audio processing
2. **Speed to Answer** - Faster response times  
3. **Completeness of Answer** - Full SEED/FEED/UNLOCK framework

---

### **📊 Stage 1: First Upgrades (Quick Wins)**
**Expected Impact:** 15-25% latency reduction

#### **Sound Optimization:**
- `audio/vad.py` - WebRTC VAD for dead air removal
- `audio/rnnoise.py` - RNNoise denoiser integration
- **Expected:** 40-70ms faster ASR processing

#### **Speed to Answer:**
- `tools/http_client.py` - Singleton HTTP clients
- `tools/cache.py` - Startup caching for Supabase data
- **Expected:** 50-100ms per API call saved

#### **Completeness of Answer:**
- `llm/heuristics.py` - SEED/FEED/UNLOCK completeness checker
- Fast-vs-smart LLM decision rules
- **Expected:** 95%+ framework completeness

#### **Files Created:**
```
agent/
├─ audio/
│  ├─ vad.py
│  └─ rnnoise.py
├─ llm/
│  └─ heuristics.py
└─ tools/
   ├─ http_client.py
   ├─ cache.py
   └─ telemetry.py
```

---

### **⚡ Stage 2: Middle Ground (Streaming + Early ACK)**
**Expected Impact:** 40-60% latency reduction

#### **Sound Optimization:**
- `audio/processor.py` - Streaming ASR (100ms chunks)
- OpenAI/Deepgram low-latency mode
- **Expected:** 80-120ms faster partial transcripts

#### **Speed to Answer:**
- `llm/dual_llm.py` - Early fast-ACK on 6 words
- LLM streaming with partial flush
- **Expected:** ACK at 350ms vs 700ms

#### **Completeness of Answer:**
- `llm/tool_selection.py` - Smart tool usage decisions
- `llm/thinking.py` - Structured reasoning guidance
- `convo/context.py` - Context window management
- **Expected:** Better tool selection, cleaner responses

#### **Files Enhanced/Created:**
```
agent/
├─ audio/
│  └─ processor.py (enhanced)
├─ llm/
│  ├─ dual_llm.py (enhanced)
│  ├─ tool_selection.py
│  └─ thinking.py
├─ convo/
│  └─ context.py
└─ tools/
   └─ telemetry.py (enhanced)
```

---

### **🏁 Stage 3: Fully Optimized (Production Ready)**
**Expected Impact:** 70-85% latency reduction

#### **Sound Optimization:**
- Dynamic audio processing gating
- Speaker diarization only when needed
- **Expected:** Minimal overhead, maximum quality

#### **Speed to Answer:**
- Circuit breakers for cost control
- Graceful degradation with timeouts
- **Expected:** Consistent sub-400ms ACK

#### **Completeness of Answer:**
- Agent mental model simulation
- Full evaluation framework
- Advanced context management
- **Expected:** 99%+ framework delivery

---

## **📈 Benchmarking Strategy**

### **Metrics to Track:**
1. **ASR Latency** - Time to first partial transcript
2. **ACK Latency** - Time to acknowledgment response
3. **Full Latency** - Time to complete SEED/FEED/UNLOCK plan
4. **Framework Completeness** - % of responses with all 3 components
5. **Audio Quality** - WER (Word Error Rate) improvements
6. **Cost Efficiency** - Token usage per interaction

### **Measurement Tools:**
- **Streamlit Dashboard** - Real-time latency visualization
- **StatsD + Grafana** - Production metrics
- **CSV Export** - Historical data analysis
- **A/B Testing** - Stage comparison

---

## **🔄 Git Workflow**

### **Branch Strategy:**
```bash
main                    # Production (current working system)
├─ stage1-upgrades     # First optimization batch
├─ stage2-streaming    # Streaming + early ACK
└─ stage3-optimized    # Full optimization
```

### **Deployment Strategy:**
1. **Develop on branch** - Test locally with Streamlit
2. **Deploy to canary** - `fly deploy --app agent-canary`
3. **Benchmark results** - Compare metrics in dashboard
4. **Merge to main** - Only if metrics improve
5. **Deploy to production** - `fly deploy --app agent-prod`

---

## **🛡️ Safety Guarantees**

### **Non-Breaking Principles:**
- All changes are **additive layers**
- Core LiveKit + RPC + Python functions **unchanged**
- **Rollback capability** at each stage
- **Backward compatibility** maintained
- **A/B testing** before full deployment

### **Risk Mitigation:**
- **Canary deployments** for each stage
- **Automated rollback** if latency increases
- **Circuit breakers** for cost protection
- **Graceful degradation** for service failures

---

## **📋 Implementation Checklist**

### **Stage 1: First Upgrades**
- [ ] Create `audio/vad.py` with WebRTC VAD
- [ ] Create `audio/rnnoise.py` with denoiser
- [ ] Create `tools/http_client.py` with singleton clients
- [ ] Create `tools/cache.py` with startup caching
- [ ] Create `llm/heuristics.py` with framework rules
- [ ] Create `tools/telemetry.py` with StatsD integration
- [ ] Deploy to canary and benchmark
- [ ] Merge to main if metrics improve

### **Stage 2: Middle Ground**
- [ ] Enhance `audio/processor.py` with streaming ASR
- [ ] Enhance `llm/dual_llm.py` with early ACK
- [ ] Create `llm/tool_selection.py` for smart decisions
- [ ] Create `llm/thinking.py` for reasoning guidance
- [ ] Create `convo/context.py` for window management
- [ ] Enhance telemetry for new metrics
- [ ] Deploy to canary and benchmark
- [ ] Merge to main if metrics improve

### **Stage 3: Fully Optimized**
- [ ] Add agent mental model simulation
- [ ] Implement circuit breakers and degradation
- [ ] Complete context management system
- [ ] Build evaluation framework
- [ ] Add dynamic processing gating
- [ ] Deploy to canary and benchmark
- [ ] Merge to main if metrics improve

---

## **🎯 Success Criteria**

### **Stage 1 Success:**
- ASR latency: 450ms → 380ms
- ACK latency: 700ms → 600ms
- Full latency: 2000ms → 1800ms
- Framework completeness: 60% → 85%

### **Stage 2 Success:**
- ASR latency: 380ms → 220ms
- ACK latency: 600ms → 350ms
- Full latency: 1800ms → 1400ms
- Framework completeness: 85% → 95%

### **Stage 3 Success:**
- ASR latency: 220ms → 100ms
- ACK latency: 350ms → 200ms
- Full latency: 1400ms → 250ms
- Framework completeness: 95% → 99%

---

## **📊 Dashboard Requirements**

### **Real-Time Metrics:**
- Live latency graphs (ASR, ACK, Full)
- Framework completeness percentage
- Audio quality indicators
- Cost tracking per session

### **Historical Analysis:**
- Stage-by-stage comparison
- Trend analysis over time
- Performance regression detection
- A/B test results visualization

### **Alerting:**
- Latency regression alerts
- Cost spike notifications
- Framework completeness drops
- Audio quality degradation

---

*This plan ensures systematic, measurable improvement while maintaining system stability and providing clear rollback paths at every stage.*
