# Synca Project

Synca is a financial management application that allows users to track their expenses through WhatsApp. The application is designed to be simple and user-friendly, eliminating the need for traditional apps or spreadsheets.

## Project Structure

The project is organized into the following directories and files:

```
synca
├── app
│   ├── main.py              # Initializes the application and sets up navigation
│   ├── auth.py              # Handles user authentication via WhatsApp number
│   ├── dashboard.py         # Main page with financial summary and charts
│   ├── configuracoes.py     # Displays user data and plan information
│   ├── relatorios.py        # Lists reports with filtering options
│   ├── api.py               # Functions for consuming the API
│   └── db.py                # Auxiliary functions for API requests
├── landing
│   ├── index.html           # Landing page for user registration
│   └── styles.css           # Styles for the landing page
├── .streamlit
│   └── config.toml          # Configuration for Streamlit interface
├── requirements.txt         # Project dependencies
└── README.md                # Project documentation
```

## Features

- **User Authentication**: Users can log in using their WhatsApp number, which is validated against the API.
- **Dashboard**: Provides a summary of expenses, including:
  - Total expenses for the month
  - Pie chart of expenses by category
  - Bar chart of daily expenses
  - List of recent expenses
- **Reports**: Users can view and filter reports by type and date.
- **User Settings**: Displays user information and current plan details.

## API Structure

The application interacts with an API that returns data from the following tables:

- **users**: Contains user information such as WhatsApp number, name, plan, and creation/expiration dates.
- **plans**: Details about subscription plans, including limits and features.
- **expenses**: Records of user expenses with details like description, value, and category.
- **reports**: Information about reports sent to users.

## Getting Started

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd synca
   ```
3. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Run the application:
   ```
   python app/main.py
   ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

