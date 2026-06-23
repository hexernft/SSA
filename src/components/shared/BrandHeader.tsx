import logoDark from "../../assets/logo-dark.png";

type BrandHeaderProps = {
  title: string;
  subtitle: string;
};

export function BrandHeader({ title, subtitle }: BrandHeaderProps) {
  return (
    <div className="brand-header">
      <img src={logoDark} alt="Sleek Stitch Atelier" className="brand-header-logo" />
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}
