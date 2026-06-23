import type { BusinessSettings } from "../../types";
import logoDark from "../../assets/logo-dark.png";

type PrintBrandProps = {
  settings: BusinessSettings | null;
};

export function PrintBrand({ settings }: PrintBrandProps) {
  return (
    <div className="print-brand">
      <img src={logoDark} alt="Sleek Stitch Atelier" className="print-brand-logo" />
      <div className="business-box">
        <h2>{settings?.businessName || "Sleek Stitch Atelier"}</h2>
        <p>{settings?.businessAddress || "Business address"}</p>
        <p>{settings?.businessPhone}</p>
        <p>{settings?.businessEmail}</p>
      </div>
    </div>
  );
}
