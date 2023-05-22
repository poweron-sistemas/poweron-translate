import { TreeNode } from "primeng/api";
import { POTSettings } from "./settings";
import { POTLanguage } from "./language";

export interface POTProject {
  name: string;
  version: string;
  primary: string;
  settings: POTSettings;
  selection: string[];
  nodes: TreeNode[];
  languages: POTLanguage[];
}
