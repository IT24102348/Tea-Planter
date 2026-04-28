import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import numpy as np
import os

def evaluate_model():
    print("Step 5: Model Evaluation and Validation")
    data_path = "data/ml_ready_data.csv"
    model_path = os.path.join("models", "tea_price_model.pkl")
    
    if not os.path.exists(data_path) or not os.path.exists(model_path):
        print("Please complete Steps 3 and 4 before running evaluation.")
        return
        
    df = pd.read_csv(data_path)
    
    # 1. Train/Test Split logic (identical to training step)
    X = df[['Year', 'Month_Encoded', 'Estate_Encoded', 'Time_Index', 'Sri_Lanka_Dollar Rate(LKR)']]
    y = df['Price']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Load optimal model
    model = joblib.load(model_path)
    
    # Predictions
    y_pred = model.predict(X_test)
    y_train_pred = model.predict(X_train)
    
    # 2. Main Metrics Calculation
    mae = mean_absolute_error(y_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2_test = r2_score(y_test, y_pred)
    r2_train = r2_score(y_train, y_train_pred)
    
    print("\n--- Model Evaluation Metrics (Test Set) ---")
    print(f"Mean Absolute Error (MAE): {mae:.2f} LKR")
    print(f"Root Mean Squared Error (RMSE): {rmse:.2f} LKR")
    print(f"Test R² Score: {r2_test:.4f}")
    
    # 3. Overfitting Check
    print("\n--- Overfitting/Underfitting Check ---")
    print(f"Training R² Score: {r2_train:.4f}")
    print(f"Testing  R² Score: {r2_test:.4f}")
    difference = r2_train - r2_test
    
    if difference > 0.15:
        print("Warning: The model might be slightly overfitting based on the variance between train and test scores.")
    elif r2_test < 0.6:
        print("Warning: The model may be underfitting since the testing score is low.")
    else:
        print("Model condition is Good. It generalizes well with no severe overfitting.")
        
    # 4. Cross-validation Validation
    print("\n--- K-Fold Cross Validation (k=5) ---")
    cv_scores = cross_val_score(model, X, y, cv=5, scoring='r2')
    print(f"Fold R² Scores: {np.round(cv_scores, 4)}")
    print(f"Average Cross-Validation R² Score: {cv_scores.mean():.4f}")
    print("-" * 40)

if __name__ == "__main__":
    evaluate_model()
