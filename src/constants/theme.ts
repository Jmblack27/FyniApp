
export const lightTheme = {
  mode: "light" as const,
  colors: {
    background: "#F5F7FA",
    surface: "#FFFFFF",
    primary: "#176B55",
    primaryLight: "#E4F2EC",
    text: "#17212B",
    secondaryText: "#788493",
    border: "#E8EDF2",
    income: "#159A68",
    expense: "#E45B65",
    iconBackground: "#F0F3F6",
  },
};

export const darkTheme = {
  mode: "dark" as const,
  colors: {
    background: "#101820",
    surface: "#1C2935",
    primary: "#42B58B",
    primaryLight: "#24473D",
    text: "#F5F7FA",
    secondaryText: "#A0ADBA",
    border: "#344452",
    income: "#42C995",
    expense: "#F07880",
    iconBackground: "#293744",
  },
};

export type AppTheme =
  | typeof lightTheme
  | typeof darkTheme;
