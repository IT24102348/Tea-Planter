import pandas as pd
import numpy as np
import os

def clean_data():
    print("Step 1: Data Selection and Cleaning")
    # Define file paths using relative structure
    input_file = "data/Tea_Price_dataset.csv"
    output_dir = "data"
    output_file = os.path.join(output_dir, "data_cleaned_validated.csv")
    
    # 1. Load dataset
    print(f"Loading dataset from {input_file}...")
    df = pd.read_csv(input_file)
    
    print("Initial Data Shape:", df.shape)
    
    # 2. Handle missing values
    # Backward fill to keep the time-series trend, then forward fill
    df.bfill(inplace=True)
    df.ffill(inplace=True)
    print("Missing values handled.")
    
    # 3. Remove duplicates
    duplicates = df.duplicated().sum()
    if duplicates > 0:
        df.drop_duplicates(inplace=True)
        print(f"Removed {duplicates} duplicate rows.")
    else:
        print("No duplicate rows found.")
        
    # 4. Fix column data types
    # Ensure Year is integer
    df['Year'] = df['Year'].astype(int)
    
    # Ensure numerical features are float
    numerical_cols = ['Kendalanda', 'Lassakanda', 'TRI', 'Sri_Lanka_Dollar Rate(LKR)']
    for col in numerical_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        # Fill any NaNs created by coercion with median
        df[col].fillna(df[col].median(), inplace=True)
        
    print("Data types validated and corrected.")
    
    # 5. Detect and handle outliers (using Interquartile Range method)
    # We apply limits based on normal historical tea prices range cap 
    for col in numerical_cols:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        # Cap the outliers to bounds rather than dropping to preserve sequence
        df[col] = np.where(df[col] < lower_bound, lower_bound, df[col])
        df[col] = np.where(df[col] > upper_bound, upper_bound, df[col])
        
    print("Outliers handled via IQR capping.")
    
    # Save the cleaned and validated dataset
    df.to_csv(output_file, index=False)
    print(f"Cleaned dataset saved to {output_file}")
    print("-" * 40)

if __name__ == "__main__":
    clean_data()
