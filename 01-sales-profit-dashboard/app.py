"""
Sales & Profit Dashboard

Run:  streamlit run app.py
"""
from pathlib import Path

import pandas as pd
import plotly.express as px
import streamlit as st

from cleaning import clean_sales, kpis

SAMPLE_FILE = Path(__file__).parent / "data" / "sales_raw.csv"

st.set_page_config(page_title="Sales & Profit Dashboard", page_icon="📊", layout="wide")


def inr(amount: float) -> str:
    """Format money the Indian way: 12,34,567 -> ₹12.35 L"""
    if amount >= 1_00_00_000:
        return f"₹{amount / 1_00_00_000:.2f} Cr"
    if amount >= 1_00_000:
        return f"₹{amount / 1_00_000:.2f} L"
    return f"₹{amount:,.0f}"


@st.cache_data
def load(file) -> tuple[pd.DataFrame, dict]:
    raw = pd.read_csv(file)
    return clean_sales(raw)


# ---------- data source ----------
st.title("📊 Sales & Profit Dashboard")
st.caption("Upload a messy sales export. The app cleans it and shows where the money is made.")

uploaded = st.sidebar.file_uploader("Upload sales CSV", type="csv")
if uploaded:
    df, report = load(uploaded)
elif SAMPLE_FILE.exists():
    df, report = load(SAMPLE_FILE)
    st.sidebar.info("Showing sample data. Upload your own CSV above.")
else:
    st.error("No data found. Run `python generate_data.py` first.")
    st.stop()

# ---------- filters ----------
st.sidebar.header("Filters")
regions = st.sidebar.multiselect("Region", sorted(df["Region"].unique()), default=sorted(df["Region"].unique()))
categories = st.sidebar.multiselect("Category", sorted(df["Category"].unique()), default=sorted(df["Category"].unique()))
view = df[df["Region"].isin(regions) & df["Category"].isin(categories)]

if view.empty:
    st.warning("No data for these filters.")
    st.stop()

# ---------- KPI cards ----------
k = kpis(view)
c1, c2, c3, c4 = st.columns(4)
c1.metric("Revenue", inr(k["revenue"]))
c2.metric("Profit", inr(k["profit"]))
c3.metric("Profit margin", f"{k['margin_pct']:.1f}%")
c4.metric("Orders", f"{k['orders']:,}")

# ---------- monthly trend ----------
monthly = view.groupby("Month")[["Revenue", "Profit"]].sum().reset_index()
fig = px.line(monthly, x="Month", y=["Revenue", "Profit"], markers=True, title="Monthly revenue and profit")
fig.update_layout(yaxis_title="₹", legend_title="")
st.plotly_chart(fig, width="stretch")

# ---------- product & region ----------
left, right = st.columns(2)

by_product = (
    view.groupby("Product")[["Revenue", "Profit"]].sum()
    .assign(**{"Margin %": lambda t: (t["Profit"] / t["Revenue"] * 100).round(1)})
    .sort_values("Profit", ascending=True)
    .reset_index()
)
left.plotly_chart(
    px.bar(by_product, x="Profit", y="Product", orientation="h", title="Profit by product",
           hover_data=["Revenue", "Margin %"]),
    width="stretch",
)

by_region = view.groupby("Region")["Profit"].sum().sort_values(ascending=False).reset_index()
right.plotly_chart(px.bar(by_region, x="Region", y="Profit", title="Profit by region"), width="stretch")

# ---------- insights in plain language ----------
st.subheader("Key insights")
best = by_product.iloc[-1]
worst_margin = by_product.sort_values("Margin %").iloc[0]
best_month = monthly.loc[monthly["Profit"].idxmax()]
st.markdown(
    f"- **{best['Product']}** makes the most profit: {inr(best['Profit'])}.\n"
    f"- **{worst_margin['Product']}** has the lowest margin ({worst_margin['Margin %']}%). Check its pricing or supplier cost.\n"
    f"- The best month was **{best_month['Month']:%B %Y}** with {inr(best_month['Profit'])} profit.\n"
    f"- **{by_region.iloc[0]['Region']}** is the most profitable region."
)

# ---------- data quality report ----------
with st.expander("🧹 Data cleaning report"):
    st.write(f"Rows received: **{report['rows_received']}**")
    st.write(f"Empty rows removed: **{report['empty_rows_removed']}**")
    st.write(f"Duplicate invoices removed: **{report['duplicates_removed']}**")
    st.write(f"Rows with missing date/qty/price removed: **{report['unusable_rows_removed']}**")
    st.write(f"Clean rows used: **{report['clean_rows']}**")

st.download_button(
    "⬇️ Download cleaned data (CSV)",
    view.drop(columns=["Month"]).to_csv(index=False).encode("utf-8-sig"),
    file_name="sales_clean.csv",
    mime="text/csv",
)
