import pandas as pd
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
import joblib
import os

def train_models():
    print("Step 4: Model Training and Hyperparameter Tuning")
    os.makedirs("models", exist_ok=True)
    
    # Load feature-engineered data
    df = pd.read_csv("data/ml_ready_data.csv")
    
    # Features and Target
    X = df[['Year', 'Month_Encoded', 'Estate_Encoded', 'Time_Index', 'Sri_Lanka_Dollar Rate(LKR)']]
    y = df['Price']
    
    # Train/Test Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Baseline Models...")
    
    # Test a simple Linear Regression model
    lr = LinearRegression()
    lr.fit(X_train, y_train)
    print(f"Linear Regression Initial R² Score: {lr.score(X_test, y_test):.4f}")
    
    # Test a Random Forest model
    rf = RandomForestRegressor(random_state=42)
    rf.fit(X_train, y_train)
    print(f"Random Forest Initial R² Score: {rf.score(X_test, y_test):.4f}")
    
    print("\nTuning the best performing model (Random Forest)...")
    # Define hyperparameter grid for tuning
    param_grid = {
        'n_estimators': [50, 100, 150],
        'max_depth': [None, 10, 20],
        'min_samples_split': [2, 5]
    }
    
    grid_search = GridSearchCV(
        estimator=RandomForestRegressor(random_state=42), 
        param_grid=param_grid, 
        cv=3, 
        scoring='r2',
        n_jobs=1
    )
    
    # Fit the grid search model
    grid_search.fit(X_train, y_train)
    
    best_model = grid_search.best_estimator_
    print(f"Best parameters selected: {grid_search.best_params_}")
    
    # Save best model to disk
    model_path = os.path.join("models", "tea_price_model.pkl")
    joblib.dump(best_model, model_path)
    
    print(f"Final best model saved successfully to: {model_path}")
    print("-" * 40)

if __name__ == "__main__":
    train_models()
