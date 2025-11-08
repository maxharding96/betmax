# BetMax
A CLI tool that helps you find value bets in football player markets by combining statistical analysis with real-time odds data.

The tool scrapes football statistics for players, calculates probabilities for specific markets based on their performance data, then compares these calculated probabilities against current bookmaker odds. It identifies discrepancies where the statistical probability suggests better value than the odds imply, and generates a spreadsheet showing the best value betting opportunities.

Built with Typescript and uses an interactive CLI to guide you through selecting leagues, fixtures and markets to analyze.

### **Quick start**
```
# clone repositry
git clone https://github.com/maxharding96/betmax.git
cd betmax

# install dependencies
bun install

# run script
bun start
```

### Usage

**1. Make your choices in the terminal**

![demo](https://github.com/user-attachments/assets/cbfafb23-7fcc-457a-adee-27fa471cf07f)

**2. Get your custom spreadsheet**

<img width="936" height="342" alt="output" src="https://github.com/user-attachments/assets/2dbb4e2d-3255-4bef-94ca-904c666d3756" />

**Best odds** is the best odds found via [OddsChecker](https://www.oddschecker.com/) on event happening.<br/>
**Probability** is the calculated probabilty that the event will happen.<br/>
**Value** is the estimated value (EV) of the bet.

