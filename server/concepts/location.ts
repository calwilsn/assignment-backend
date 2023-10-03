import { BaseDoc } from "../framework/doc";

export interface LocationDoc extends BaseDoc {
  x: Number;
  y: Number;
  name?: string;
}