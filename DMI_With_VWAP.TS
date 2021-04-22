# Directional Movement Index (DMI) with a Moving Average and VWAP Plotted
# Author: TechRancher
# You can follow me at: https://github.com/TechRancher
# This script will plot out the Directional Movement of Buyer
# and Sellers. I have coded in arrow indicators to display
# when the buyers are in control. I also added in my Trend Indicator
# script with part of my Avg_Trade_Range_Label script to display
# information in the upper labels. To get a better understanding 
# how this script works then read my README.md at: 
# https://github.com/TechRancher/DirectionalMovingIndicatorWithVWAP

declare lower;

# User Input
input length = 9; #hint Length: Length defines period on which the average value is found to calculate the price trend (ATR) and price range of who is in control of this stock. Buyers or Sellers.
input averageType = AverageType.WILDERS;#hint averageType: Available average types are: Simple, Exponential, Weighted, Wilder's, and Hull. You can search online to learn more about each type that can be used.
input timeFrame = {default DAY, WEEK, MONTH};#hint timeFrame: You can choose from Day, Week, or Month. This will determine the anchor for the VWAP plot.
input trendLengthTimeFrame = 20;#hint trendLengthTimeFrame: This time is how far back in bars you want to calculate to determine the trend.

# Define Variables
def hiDiff = high - high[1];
def loDiff = low[1] - low;
def plusDM = if hiDiff > loDiff and hiDiff > 0 then hiDiff else 0;
def minusDM =  if loDiff > hiDiff and loDiff > 0 then loDiff else 0;
def cap = getAggregationPeriod();
def errorInAggregation =
    timeFrame == timeFrame.DAY and cap >= AggregationPeriod.WEEK or
    timeFrame == timeFrame.WEEK and cap >= AggregationPeriod.MONTH;
assert(!errorInAggregation, "timeFrame should be not less than current chart aggregation period");
def yyyyMmDd = getYyyyMmDd();
def periodIndx;
switch (timeFrame) {
case DAY:
    periodIndx = yyyyMmDd;
case WEEK:
    periodIndx = Floor((daysFromDate(first(yyyyMmDd)) + getDayOfWeek(first(yyyyMmDd))) / 7);
case MONTH:
    periodIndx = roundDown(yyyyMmDd / 100, 0);
}
def volumeSum;
def volumeVwapSum;
def volumeVwap2Sum;
def isPeriodRolled = compoundValue(1, periodIndx != periodIndx[1], yes);
if (isPeriodRolled) {
        volumeSum = volume;
        volumeVwapSum = volume * vwap;
        volumeVwap2Sum = volume * Sqr(vwap);
    } else {
        volumeSum = compoundValue(1, volumeSum[1] + volume, volume);
        volumeVwapSum = compoundValue(1, volumeVwapSum[1] + volume * vwap, volume * vwap);
        volumeVwap2Sum = compoundValue(1, volumeVwap2Sum[1] + volume * Sqr(vwap), volume * Sqr(vwap));
    }
def price1 = volumeVwapSum / volumeSum;

# Define Plot
def ATR = MovingAverage(averageType, TrueRange(high, close, low), length);
plot Buyers = 100 * MovingAverage(averageType, plusDM, length) / ATR;
plot Sellers = 100 * MovingAverage(averageType, minusDM, length) / ATR;

def DX = if (Buyers + Sellers > 0) then 100 * AbsValue(Buyers - Sellers) / (Buyers + Sellers) else 0;
plot ADX = MovingAverage(averageType, DX, length);
plot VWAP = price1;

# Plot Details
Buyers.SetDefaultColor(CreateColor(95, 81, 240));
Sellers.SetDefaultColor(CreateColor(219, 10, 31));
ADX.SetDefaultColor(CreateColor(224, 225, 225));
VWAP.setDefaultColor(CreateColor(168, 255, 31));

# Add Arrows
def vol = volume();
def vol1 = volume()[1];
def buyInControl =  Crosses(Buyers, Sellers, CrossingDirection.ABOVE);
def buyUp = if buyInControl and vol > vol1  then 1 else 0;
plot buyNow = buyUp;
buyNow.SetPaintingStrategy(PaintingStrategy.BOOLEAN_ARROW_UP);


# Trend Indicator Label
AddLabel(yes, if close from trendLengthTimeFrame bars ago < close then "Uptrend" else "Downtrend");

# Volume and Volatility Label
AddLabel(yes, "Volume: " + Volume + ", Volatility: " + imp_volatility , Color.LIGHT_GRAY);

