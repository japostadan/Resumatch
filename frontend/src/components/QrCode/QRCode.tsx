import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Props = {
  value: string;
  size?: number;
};

export function GameQRCode({ value, size = 180 }: Props) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    QRCode.toDataURL(value).then(setSrc);
  }, [value]);

  if (!src) return null;

  return <img src={src} alt="QR code for joining the game" width={size} height={size} />;
}
