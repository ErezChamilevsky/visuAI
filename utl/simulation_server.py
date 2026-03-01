
import http.server
import socketserver
import json
import os
import sys
from urllib.parse import urlparse, parse_qs

# Import assignment modules
# Ensure current directory is in path
sys.path.append(os.getcwd())
import ext_plant
import ex3 as ex2
import numpy as np

class NumpyEncoder(json.JSONEncoder):
    """ Custom encoder for numpy data types """
    def default(self, obj):
        if isinstance(obj, (np.int_, np.intc, np.intp, np.int8,
                            np.int16, np.int32, np.int64, np.uint8,
                            np.uint16, np.uint32, np.uint64)):
            return int(obj)

        elif isinstance(obj, (np.float_, np.float16, np.float32, np.float64)):
            return float(obj)

        elif isinstance(obj, (np.complex_, np.complex64, np.complex128)):
            return {'real': obj.real, 'imag': obj.imag}

        elif isinstance(obj, (np.ndarray,)):
            return obj.tolist()

        elif isinstance(obj, (np.bool_)):
            return bool(obj)

        elif isinstance(obj, (np.void)): 
            return None

        return json.JSONEncoder.default(self, obj)


# --- Game Configuration (Based on quick_test.py "PDF3") ---
PROBLEM_CONFIG = {
    "Size": (3, 3),
    "Walls": {(0, 1), (2, 1)},
    "Taps": {(1, 1): 6},
    "Plants": {(2, 0): 2, (0, 2): 3},
    "Robots": {10: (1, 0, 0, 2), 11: (1, 2, 0, 2)},
    "robot_chosen_action_prob": {
        10: 0.95,
        11: 0.9,
    },
    "goal_reward": 10,
    "plants_reward": {
        (0, 2): [1, 2, 3, 4],
        (2, 0): [1, 2, 3, 4],
    },
    "seed": 45,
    "horizon": 60,


}


class SimulationState:
    def __init__(self):
        self.reset()

    def reset(self):
        # Re-initialize game
        self.problem_config = PROBLEM_CONFIG.copy()
        # Random seed? Fixed for now for reproducibility
        self.game = ext_plant.create_pressure_plate_game((self.problem_config, True))
        self.controller = ex2.Controller(self.game)
        self.last_action = "RESET"
        self.done = False

    def step(self):
        if self.game.get_done():
            self.done = True
            return

        # Use the controller to choose action
        action = self.controller.choose_next_action(self.game.get_current_state())
        self.last_action = action
        
        print(f"Executing single simulation step. Action: {action}")
        
        # Apply action
        try:
            self.game.submit_next_action(action)
        except Exception as e:
            print(f"Error submitting action: {e}")
            # If error, maybe done or invalid?
            pass
            
        self.done = self.game.get_done()

    def get_serializable_state(self):
        # Convert internal state to JSON-friendly format
        # State tuple: (robots_t, plants_t, taps_t, total_water_need)
        state_tuple = self.game.get_current_state()
        robots_t, plants_t, taps_t, total_need = state_tuple

        # Robots: (rid, (r, c), load)
        robots = []
        for rid, (r, c), load in robots_t:
            robots.append({
                "id": rid,
                "r": r,
                "c": c,
                "load": load,
                "cap": self.game._capacities[rid],
                "success_prob": self.problem_config["robot_chosen_action_prob"][rid]
            })

        # Plants: (r, c) -> need
        # The state tuple stores ((r,c), need), convert directly
        plants = []
        for (r, c), need in plants_t:
            plants.append({"r": r, "c": c, "need": need})

        # Taps: (r, c) -> water
        taps = []
        for (r, c), water in taps_t:
            taps.append({"r": r, "c": c, "water": water})

        return {
            "rows": self.game.rows,
            "cols": self.game.cols,
            "walls": [{"r": r, "c": c} for r, c in self.game.walls],
            "robots": robots,
            "plants": plants,
            "taps": taps,
            "steps": self.game._steps,
            "max_steps": self.game._max_steps,
            "reward": self.game._reward,
            "done": self.done,
            "last_action": self.last_action,
            "total_need": total_need
        }

# Global state instance
sim_state = SimulationState()

class SimulationHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/":
            self.path = "/simulation_gui.html"
            return http.server.SimpleHTTPRequestHandler.do_GET(self)
        
        if parsed.path == "/api/state":
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = json.dumps(sim_state.get_serializable_state(), cls=NumpyEncoder)
            self.wfile.write(response.encode())
            return

        # Fallback to serving files
        return http.server.SimpleHTTPRequestHandler.do_GET(self)

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/step":
            sim_state.step()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = json.dumps(sim_state.get_serializable_state(), cls=NumpyEncoder)
            self.wfile.write(response.encode())
            return
        
        if parsed.path == "/api/reset":
            sim_state.reset()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response = json.dumps(sim_state.get_serializable_state(), cls=NumpyEncoder)
            self.wfile.write(response.encode())
            return
            
        self.send_error(404, "Unknown API endpoint")

PORT = 8000

print(f"Starting simulation server at http://localhost:{PORT}")
print("Open your browser to this URL to view the simulation.")

try:
    with socketserver.TCPServer(("", PORT), SimulationHandler) as httpd:
        httpd.serve_forever()
except OSError as e:
    print(f"Error starting server: {e}")
    print("Port 8000 might be in use.")
