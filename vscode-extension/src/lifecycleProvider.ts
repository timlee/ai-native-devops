import * as vscode from "vscode";
import * as path from "path";
import { PHASES, Phase } from "./phases";

export class LifecycleTreeItem extends vscode.TreeItem {
  constructor(
    public readonly phase: Phase,
    public readonly isActive: boolean,
    public readonly resourceUri?: vscode.Uri
  ) {
    super(phase.label, vscode.TreeItemCollapsibleState.None);
    this.contextValue = "phase";
    this.description = isActive ? "active" : "";

    const tooltip = new vscode.MarkdownString(
      `**${phase.label}**\n\nPhase ${phase.id} of 11 · Click to open guide`
    );
    tooltip.isTrusted = true;
    this.tooltip = tooltip;

    if (isActive) {
      this.iconPath = new vscode.ThemeIcon(
        "circle-filled",
        new vscode.ThemeColor("charts.blue")
      );
    } else {
      this.iconPath = new vscode.ThemeIcon("circle-outline");
    }

    this.command = {
      command: "aiNativeDevOps.openPhase",
      title: "Open Phase Guide",
      arguments: [phase],
    };
  }
}

export class LifecycleProvider
  implements vscode.TreeDataProvider<LifecycleTreeItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    LifecycleTreeItem | undefined | null | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private context: vscode.ExtensionContext) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: LifecycleTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(): LifecycleTreeItem[] {
    const currentPhase = vscode.workspace
      .getConfiguration("aiNativeDevOps")
      .get<number>("currentPhase", 1);

    return PHASES.map(
      (phase) => new LifecycleTreeItem(phase, phase.id === currentPhase)
    );
  }
}
