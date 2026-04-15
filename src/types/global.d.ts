declare module "*.css";
declare module "*.jpg";
declare module "*.png";
declare module "*.jpeg";
declare module "*.svg";
declare module "*.gif";
declare module "*.bmp";
declare module "*.webp";

declare module "*.module.css" {
    const classes: { [key: string]: string }
    export default classes
}