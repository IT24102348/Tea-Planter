from flask import Flask, request, jsonify, render_template_string
from flask_cors import CORS
import joblib
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# Basic Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")

# Attempt to load ML models and scalers upon app startup
try:
    model = joblib.load(os.path.join(MODELS_DIR, "tea_price_model.pkl"))
    month_encoder = joblib.load(os.path.join(MODELS_DIR, "month_encoder.pkl"))
    estate_encoder = joblib.load(os.path.join(MODELS_DIR, "estate_encoder.pkl"))
    scaler = joblib.load(os.path.join(MODELS_DIR, "scaler.pkl"))
    print("Machine Learning Models loaded successfully!")
except Exception as e:
    model, month_encoder, estate_encoder, scaler = None, None, None, None
    print(f"Warning: Model components missing. Run scripts 01 through 04 first.\nError: {e}")

# Minimum year present in the original dataset, used for custom Time_Index calculation
BASE_YEAR = 2014

HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Tea Price Predictor</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; background-color: #eef2f3; }
        .container { max-width: 500px; margin: auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        h2 { text-align: center; color: #2E8B57; }
        label { font-weight: 600; margin-top: 10px; display: block; color: #333; }
        input, select { width: 100%; padding: 10px; margin: 10px 0 20px 0; border: 1px solid #ccc; border-radius: 6px; box-sizing: border-box; }
        button { background-color: #2E8B57; color: white; padding: 12px 15px; border: none; border-radius: 6px; cursor: pointer; width: 100%; font-size: 16px; font-weight: bold; transition: background 0.3s; }
        button:hover { background-color: #246B43; }
        .result { margin-top: 25px; font-weight: bold; text-align: center; color: #2E8B57; font-size: 22px; padding: 10px; border-radius: 8px; background: #e8f5e9; display: none; }
    </style>
</head>
<body>
    <div class="container">
        <h2>🍁 Sri Lankan Tea Price Predictor</h2>
        <form id="predictForm">
            <label for="year">Year:</label>
            <input type="number" id="year" name="year" required placeholder="e.g., 2026" min="2014" value="2025">

            <label for="month">Month:</label>
            <select id="month" name="month" required>
                <option value="January">January</option>
                <option value="February">February</option>
                <option value="March">March</option>
                <option value="April">April</option>
                <option value="May">May</option>
                <option value="June">June</option>
                <option value="July">July</option>
                <option value="August">August</option>
                <option value="September">September</option>
                <option value="October">October</option>
                <option value="November">November</option>
                <option value="December">December</option>
            </select>

            <label for="estate">Estate Factory:</label>
            <select id="estate" name="estate" required>
                <option value="Kendalanda">Kendalanda</option>
                <option value="Lassakanda">Lassakanda</option>
                <option value="TRI">TRI</option>
            </select>

            <label for="dollar_rate">Dollar Rate (LKR):</label>
            <input type="number" id="dollar_rate" name="dollar_rate" required placeholder="e.g., 300.50" step="0.01" value="300.00">

            <button type="submit">Predict Tea Price</button>
        </form>
        <div class="result" id="predictionResult"></div>
    </div>

    <script>
        document.getElementById('predictForm').onsubmit = async function(e) {
            e.preventDefault();
            const data = {
                "Year": parseInt(document.getElementById('year').value),
                "Month": document.getElementById('month').value,
                "Estate": document.getElementById('estate').value,
                "Dollar_Rate": parseFloat(document.getElementById('dollar_rate').value)
            };

            try {
                const response = await fetch('/api/predict', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();
                const resultDiv = document.getElementById('predictionResult');
                resultDiv.style.display = 'block';

                if (result.predicted_price) {
                    resultDiv.style.color = '#2E8B57';
                    resultDiv.style.background = '#e8f5e9';
                    resultDiv.innerText = "Predicted Price: Rs. " + result.predicted_price.toFixed(2);
                } else {
                    resultDiv.style.color = '#d32f2f';
                    resultDiv.style.background = '#ffebee';
                    resultDiv.innerText = "Error: " + (result.error || "Failed to process request.");
                }
            } catch (err) {
                console.error(err);
            }
        };
    </script>
</body>
</html>
"""


@app.route("/", methods=["GET"])
def index():
    return render_template_string(HTML_TEMPLATE)


@app.route("/api/predict", methods=["POST"])
def predict_price():
    if not model or not scaler or not month_encoder or not estate_encoder:
        return jsonify({"error": "ML Model not fully initialized. Please run training pipeline first."}), 500

    try:
        req_data = request.json
        year_raw = req_data["Year"]
        month_raw = req_data["Month"]
        estate_raw = req_data["Estate"]
        dollar_rate = req_data["Dollar_Rate"]

        month_enc = month_encoder.transform([month_raw])[0]
        estate_enc = estate_encoder.transform([estate_raw])[0]
        time_index = (year_raw - BASE_YEAR) * 12 + month_enc

        input_data = pd.DataFrame([{
            "Year": year_raw,
            "Month_Encoded": month_enc,
            "Estate_Encoded": estate_enc,
            "Time_Index": time_index,
            "Sri_Lanka_Dollar Rate(LKR)": dollar_rate
        }])

        input_scaled = scaler.transform(input_data)
        predicted_price = model.predict(input_scaled)[0]

        return jsonify({
            "status": "success",
            "predicted_price": float(predicted_price)
        }), 200

    except ValueError as val_err:
        return jsonify({"error": f"Invalid textual input for Month or Estate: {val_err}"}), 400
    except KeyError as key_err:
        return jsonify({"error": f"Missing expected data key: {key_err}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("Starting Flask API deployment server")
    port = int(os.getenv("PORT", "5000"))
    app.run(debug=False, host="0.0.0.0", port=port)
