export type DeepfakeVerdict = "Likely Authentic" | "Needs Review" | "Likely Manipulated";

export type DeepfakeRiskLevel = "Low Risk" | "Needs Review" | "High Risk";

export type DeepfakeResponse = {
  verdict: DeepfakeVerdict;
  risk_level: DeepfakeRiskLevel;
  message: string;
  media_type: string;
};
