from flask import Flask, jsonify
import threading
import os
import asyncio
from agent_worker import main as agent_main

app = Flask(__name__)

# Global variable to track agent status
agent_running = False
agent_thread = None
agent_last_error = None

@app.route('/')
def home():
    return jsonify({
        'status': 'LiveKit Avatar Agent API',
        'version': '1.0.0',
        'agent_running': agent_running
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'agent_running': agent_running,
        'avatar': 'ready'
    })

@app.route('/start-agent', methods=['POST', 'GET'])
def start_agent():
    global agent_running, agent_thread, agent_last_error
    
    if agent_running:
        return jsonify({'status': 'Agent already running'})
    
    try:
        # Start the LiveKit agent in a background thread
        def run_agent():
            global agent_running, agent_last_error
            agent_running = True
            agent_last_error = None  # Clear last error on start
            try:
                print("Agent thread started")
                asyncio.run(agent_main())
                print("Agent thread finished gracefully")
            except Exception as e:
                print(f"Agent thread crashed: {e}")
                agent_last_error = str(e)
            finally:
                agent_running = False
        
        agent_thread = threading.Thread(target=run_agent, daemon=True)
        agent_thread.start()
        
        return jsonify({"status": "Agent started"}), 200
    except Exception as e:
        return jsonify({'status': 'Failed to start agent', 'error': str(e)}), 500

@app.route('/stop-agent', methods=['POST', 'GET'])
def stop_agent():
    global agent_running
    agent_running = False
    return jsonify({"status": "Agent stopped"})

@app.route('/status')
def status():
    env_vars = {
        'livekit_url': os.environ.get('LIVEKIT_URL', 'Not set'),
        'openai_key': 'Set' if os.getenv("OPENAI_API_KEY") else 'Not set',
        'hedra_key': 'Set' if os.environ.get('HEDRA_API_KEY') else 'Not set',
        'deepgram_key': 'Set' if os.environ.get('DEEPGRAM_API_KEY') else 'Not set'
    }
    return jsonify({
        'agent_running': agent_running,
        'thread_alive': agent_thread.is_alive() if agent_thread else False,
        'environment': env_vars,
        'last_error': agent_last_error
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
