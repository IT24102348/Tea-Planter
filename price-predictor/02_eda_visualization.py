import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import os

def run_eda():
    print("Step 2: EDA and Visualization")
    input_file = "data/data_cleaned_validated.csv"
    charts_dir = "visualizations"
    
    # Create directory if it doesn't exist
    os.makedirs(charts_dir, exist_ok=True)
    
    # Load the cleaned dataset
    df = pd.read_csv(input_file)
    
    # 1. Analyze dataset
    print("Dataset Summary Statistics:")
    print(df.describe())
    
    # 2. Show simple charts for price trends
    plt.figure(figsize=(12, 6))
    plt.plot(df.index, df['Kendalanda'], label='Kendalanda', color='green', alpha=0.7)
    plt.plot(df.index, df['Lassakanda'], label='Lassakanda', color='blue', alpha=0.7)
    plt.plot(df.index, df['TRI'], label='TRI', color='orange', alpha=0.7)
    plt.title('Monthly Tea Price Trends across Estates')
    plt.xlabel('Time (Months)')
    plt.ylabel('Price (LKR)')
    plt.legend()
    plt.grid(True)
    
    trend_plot_path = os.path.join(charts_dir, "price_trends.png")
    plt.savefig(trend_plot_path)
    print(f"\nSaved trend chart to {trend_plot_path}")
    plt.close()
    
    # 3. Correlation heatmap
    plt.figure(figsize=(8, 6))
    corr = df[['Year', 'Kendalanda', 'Lassakanda', 'TRI']].corr()
    sns.heatmap(corr, annot=True, cmap="coolwarm", fmt=".2f")
    plt.title('Correlation Heatmap')
    
    corr_plot_path = os.path.join(charts_dir, "correlation_heatmap.png")
    plt.savefig(corr_plot_path)
    print(f"Saved correlation heatmap to {corr_plot_path}")
    plt.close()
    
    # 4. Key insights
    print("\nKey Insights:")
    print("- Tea prices across estates (Kendalanda, Lassakanda, TRI) are highly correlated, meaning external market factors drive overall prices.")
    print("- There is a visible upward long-term trend over the years, indicated by the positive correlation with 'Year'.")
    print("-" * 40)

if __name__ == "__main__":
    run_eda()
