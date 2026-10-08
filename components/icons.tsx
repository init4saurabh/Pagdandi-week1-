import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement>;
const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };

export const LeafIcon = (props: Props) => <svg {...base} {...props}><path d="M19.8 4.2C13.5 3.8 6.1 6.2 5.3 12.4c-.5 3.8 2.5 6.2 5.7 5.3 5.4-1.4 7.3-7.3 8.8-13.5Z"/><path d="M4 20c2.7-4.6 6.1-7.7 11.3-10.1"/></svg>;
export const ArrowIcon = (props: Props) => <svg {...base} {...props}><path d="M5 12h14M14 7l5 5-5 5"/></svg>;
export const LocationIcon = (props: Props) => <svg {...base} {...props}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>;
export const VolumeIcon = (props: Props) => <svg {...base} {...props}><path d="M11 5 6.8 8.5H3v7h3.8L11 19V5ZM15 9c1.3 1.7 1.3 4.3 0 6M18 6.5c3.3 3 3.3 8 0 11"/></svg>;
export const CheckIcon = (props: Props) => <svg {...base} {...props}><path d="m5 12 4.2 4L19 6.8"/></svg>;
export const ClockIcon = (props: Props) => <svg {...base} {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
export const JournalIcon = (props: Props) => <svg {...base} {...props}><path d="M6 3h12v18H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"/><path d="M8 7h6M8 11h7"/></svg>;
export const SparkIcon = (props: Props) => <svg {...base} {...props}><path d="m12 2 1.3 4.2L17 8l-3.7 1.8L12 14l-1.3-4.2L7 8l3.7-1.8L12 2ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15ZM19 13l.7 1.8 1.8.7-1.8.7L19 18l-.7-1.8-1.8-.7 1.8-.7L19 13Z"/></svg>;
export const CameraIcon = (props: Props) => <svg {...base} {...props}><path d="M4 7h3l1.5-2h7L17 7h3v12H4V7Z"/><circle cx="12" cy="13" r="3.5"/></svg>;
export const ChevronIcon = (props: Props) => <svg {...base} {...props}><path d="m9 18 6-6-6-6"/></svg>;
