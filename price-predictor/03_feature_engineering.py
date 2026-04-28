import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
import joblib
import os

def feature_engineering():
    print("Step 3: Feature Engineering and Scaling")
    input_file = "data/data_cleaned_validated.csv"
    output_file = "data/ml_ready_data.csv"
    
    # We create a models directory to save useful objects for inference later
    os.makedirs("models", exist_ok=True)
    
    df = pd.read_csv(input_file)
    
    # Create a unified dataset by melting 'Estate' columns into a single 'Price' target
    print("Reshaping (melting) data for generalized training...")
    df_melted = pd.melt(df, id_vars=['Year', 'Month', 'Sri_Lanka_Dollar Rate(LKR)'], 
                        value_vars=['Kendalanda', 'Lassakanda', 'TRI'],
                        var_name='Estate', value_name='Price')
    
    # 1. Encode categorical columns ('Month', 'Estate')
    print("Encoding categorical columns...")
    month_encoder = LabelEncoder()
    estate_encoder = LabelEncoder()
    
    df_melted['Month_Encoded'] = month_encoder.fit_transform(df_melted['Month'])
    df_melted['Estate_Encoded'] = estate_encoder.fit_transform(df_melted['Estate'])
    
    # Save encoders for API phase
    joblib.dump(month_encoder, "models/month_encoder.pkl")
    joblib.dump(estate_encoder, "models/estate_encoder.pkl")
    
    # 2. Create useful features: combining Year and Month could give a generalized Time_Index
    print("Creating numerical Time_Index feature...")
    df_melted['Time_Index'] = (df_melted['Year'] - df_melted['Year'].min()) * 12 + df_melted['Month_Encoded']
    
    # 3. Apply scaling to features
    print("Applying Standard Scaling to independent features...")
    scaler = StandardScaler()
    
    # We will use 'Year', 'Month_Encoded', 'Estate_Encoded', 'Time_Index' and 'Sri_Lanka_Dollar Rate(LKR)' to predict 'Price'
    features = ['Year', 'Month_Encoded', 'Estate_Encoded', 'Time_Index', 'Sri_Lanka_Dollar Rate(LKR)']
    
    # Scale features
    df_melted[features] = scaler.fit_transform(df_melted[features])
    
    # Save the scaler for inference in API phase
    joblib.dump(scaler, "models/scaler.pkl")
    
    # Save the ready dataset
    df_melted.to_csv(output_file, index=False)
    
    print(f"Feature engineering complete. ML-ready data saved to {output_file}")
    print("Encoders and Scalers saved to models/ directory.")
    print("-" * 40)

if __name__ == "__main__":
    feature_engineering()
