# betmax
A CLI tool that helps you find value bets in football player markets by combining statistical analysis with real-time odds data.

The tool scrapes football statistics for players, calculates probabilities for specific markets based on their performance data, then compares these calculated probabilities against current bookmaker odds. It identifies discrepancies where the statistical probability suggests better value than the odds imply, and generates a spreadsheet showing the best value betting opportunities.

Built with Node.js and uses an interactive CLI to guide you through selecting leagues, fixtures and markets to analyze.

### **Quick start**
```
# clone repositry
git clone https://github.com/maxharding96/betmax.git
cd betmax

# install dependencies
bun install

# run script
bun run
```

### Usage

**1. Make your choices in the terminal**

![output](https://github.com/user-attachments/assets/e3cbd466-2189-4698-8d34-9cd49471655f)

**2. Get your custom spreadsheet**

<img width="673" height="311" alt="Screenshot 2025-10-18 at 16 45 54" src="https://github.com/user-attachments/assets/88f16bab-705c-4b91-ab01-b2fc650f5b3c" />

**Prob** is the calculated probabilty that the event will happen.

**Odd** is the best odds found via [OddsChecker](https://www.oddschecker.com/) on event happening.
