// TEMP: delete in Phase 2 — local fixture data for Phase 1 UI development only.
import type { Dataset } from "./types";

const now = new Date().toISOString();

export const fixtureDatasets: Dataset[] = [
  {
    id: "fixture-iris",
    title: "Iris Flowers",
    description:
      "Classic flower measurement dataset with sepal and petal dimensions for three species.",
    properties: [
      { key: "Rows", value: "150" },
      { key: "Columns", value: "5" },
      { key: "File size", value: "4.5 KB" },
      { key: "Source", value: "UCI ML Repository" },
      { key: "Target column", value: "species" },
      { key: "Domain", value: "Biology" },
      { key: "License", value: "CC-BY-4.0" },
      { key: "Updated", value: "2024-01-15" },
    ],
    columns: [
      {
        name: "sepal_length",
        type: "numeric",
        description: "Sepal length in cm",
        stats: { min: 4.3, max: 7.9, mean: 5.84, bins: [2, 5, 12, 18, 22, 25, 20, 16, 12, 8] },
      },
      {
        name: "sepal_width",
        type: "numeric",
        description: "Sepal width in cm",
        stats: { min: 2.0, max: 4.4, mean: 3.05, bins: [3, 8, 15, 24, 30, 26, 18, 12, 8, 6] },
      },
      {
        name: "petal_length",
        type: "numeric",
        description: "Petal length in cm",
        stats: { min: 1.0, max: 6.9, mean: 3.76, bins: [18, 12, 10, 8, 14, 20, 24, 18, 14, 12] },
      },
      {
        name: "species",
        type: "categorical",
        description: "Flower species",
        stats: {
          top: [
            { value: "setosa", pct: 33.3 },
            { value: "versicolor", pct: 33.3 },
            { value: "virginica", pct: 33.3 },
          ],
        },
      },
    ],
    preview_rows: [
      ["5.1", "3.5", "1.4", "setosa"],
      ["4.9", "3.0", "1.4", "setosa"],
      ["6.2", "3.4", "5.4", "virginica"],
      ["5.9", "3.0", "5.1", "virginica"],
      ["5.5", "2.3", "4.0", "versicolor"],
      ["6.5", "2.8", "4.6", "versicolor"],
      ["5.0", "3.6", "1.4", "setosa"],
      ["6.7", "3.1", "4.7", "versicolor"],
      ["6.3", "3.3", "6.0", "virginica"],
      ["5.8", "2.7", "5.1", "virginica"],
    ],
    row_count: 150,
    column_count: 4,
    file_url: "#",
    file_size_bytes: 4608,
    position: 0,
    created_at: now,
    updated_at: now,
  },
  {
    id: "fixture-sales",
    title: "Monthly Store Sales",
    description:
      "Two years of monthly revenue, orders, and returns for a small retail chain.",
    properties: [
      { key: "Rows", value: "24" },
      { key: "Columns", value: "5" },
      { key: "File size", value: "2.1 KB" },
      { key: "Source", value: "Internal POS export" },
    ],
    columns: [
      {
        name: "month",
        type: "date",
        description: "First day of the month",
      },
      {
        name: "revenue",
        type: "numeric",
        description: "Gross revenue in USD",
        stats: { min: 18200, max: 96500, mean: 45200, bins: [3, 4, 5, 4, 3, 2, 1, 1, 0, 1] },
      },
      {
        name: "orders",
        type: "numeric",
        description: "Number of orders placed",
        stats: { min: 210, max: 1180, mean: 540, bins: [2, 4, 5, 4, 3, 2, 2, 1, 0, 1] },
      },
      {
        name: "region",
        type: "categorical",
        description: "Store region",
        stats: {
          top: [
            { value: "North", pct: 37.5 },
            { value: "South", pct: 33.3 },
            { value: "East", pct: 29.2 },
          ],
        },
      },
      {
        name: "promo",
        type: "boolean",
        description: "A promotion ran that month",
        stats: {
          top: [
            { value: "false", pct: 62.5 },
            { value: "true", pct: 37.5 },
          ],
        },
      },
    ],
    preview_rows: [
      ["2023-01-01", "21400", "260", "North", "false"],
      ["2023-02-01", "18900", "221", "South", "false"],
      ["2023-03-01", "31200", "390", "East", "true"],
      ["2023-04-01", "29800", "355", "North", "false"],
      ["2023-05-01", "42100", "512", "South", "true"],
      ["2023-06-01", "96500", "1180", "North", "true"],
      ["2023-07-01", "52300", "640", "East", "false"],
      ["2023-08-01", "48700", "598", "South", "false"],
    ],
    row_count: 24,
    column_count: 5,
    file_size_bytes: 2150,
    position: 1,
    created_at: now,
    updated_at: now,
  },
  {
    id: "fixture-titanic",
    title: "Titanic Passengers (sample)",
    description:
      "A small sample of passenger records with survival outcome and ticket class.",
    properties: [
      { key: "Rows", value: "891" },
      { key: "Columns", value: "6" },
      { key: "File size", value: "61 KB" },
    ],
    columns: [
      {
        name: "name",
        type: "text",
        description: "Passenger full name",
      },
      {
        name: "age",
        type: "numeric",
        description: "Age in years",
        stats: { min: 0.42, max: 80, mean: 29.7, bins: [8, 14, 20, 18, 12, 8, 5, 3, 2, 1] },
      },
      {
        name: "pclass",
        type: "categorical",
        description: "Ticket class",
        stats: {
          top: [
            { value: "3", pct: 55.1 },
            { value: "1", pct: 24.2 },
            { value: "2", pct: 20.7 },
          ],
        },
      },
      {
        name: "survived",
        type: "boolean",
        description: "Survived (true/false)",
        stats: {
          top: [
            { value: "false", pct: 61.6 },
            { value: "true", pct: 38.4 },
          ],
        },
      },
      {
        name: "fare",
        type: "numeric",
        description: "Ticket fare in GBP",
        stats: { min: 0, max: 512.33, mean: 32.2, bins: [45, 12, 8, 5, 3, 2, 1, 1, 0, 1] },
      },
      {
        name: "embarked",
        type: "categorical",
        description: "Port of embarkation with a deliberately very long description to exercise ellipsis truncation in the header cell",
        stats: {
          top: [
            { value: "S", pct: 72.2 },
            { value: "C", pct: 18.9 },
            { value: "Q", pct: 8.9 },
          ],
        },
      },
    ],
    preview_rows: [
      ["Braund, Mr. Owen Harris", "22", "3", "false", "7.25", "S"],
      ["Cumings, Mrs. John Bradley with an exceptionally long name that should be truncated", "38", "1", "true", "71.28", "C"],
      ["Heikkinen, Miss. Laina", "26", "3", "true", "7.92", "S"],
      ["Futrelle, Mrs. Jacques Heath", "35", "1", "true", "53.10", "S"],
      ["Allen, Mr. William Henry", "35", "3", "false", "8.05", "S"],
      ["Moran, Mr. James", "27", "3", "false", "8.46", "Q"],
    ],
    row_count: 891,
    column_count: 6,
    file_size_bytes: 62464,
    position: 2,
    created_at: now,
    updated_at: now,
  },
];
