import path from 'node:path';
import deepEqual from 'fast-deep-equal';

import vscode from 'vscode';

export class DiagnosticsProvider {
  /**
   * Get the delta diagnostics between two diagnostics maps.
   * @param oldDiagnosticsMap - The old diagnostics map.
   * @param newDiagnosticsMap - The new diagnostics map.
   * @returns The delta diagnostics between the two maps.
   */
  public static getDeltaDiagnostics(
    oldDiagnosticsMap: Map<vscode.Uri, vscode.Diagnostic[]>,
    newDiagnosticsMap: Map<vscode.Uri, vscode.Diagnostic[]>,
  ): [vscode.Uri, vscode.Diagnostic[]][] {
    return Array.from(newDiagnosticsMap.entries())
      .map(([uri, newDiags]) => {
        const oldDiags = oldDiagnosticsMap.get(uri) || [];
        const newProblems = newDiags.filter(
          (newDiag) => !oldDiags.some((oldDiag) => deepEqual(oldDiag, newDiag)),
        );
        return newProblems.length > 0 ? [uri, newProblems] : null;
      })
      .filter(Boolean) as [vscode.Uri, vscode.Diagnostic[]][];
  }

  /**
   * Filter the diagnostics by severity.
   * @param diagnostics - The diagnostics to filter.
   * @param severity - The severity to filter by.
   */
  public static filterDiagnosticsBySeverity(
    diagnostics: [vscode.Uri, vscode.Diagnostic[]][],
    severity: vscode.DiagnosticSeverity,
  ): [vscode.Uri, vscode.Diagnostic[]][] {
    return diagnostics.map(([uri, diags]) => [
      uri,
      diags.filter((diag) => diag.severity === severity),
    ]);
  }

  /**
   * Format the diagnostics into a large language model friendly string.
   * @param diagnostics - The diagnostics to format.
   * @returns The formatted diagnostics.
   */
  public static formatDiagnostics(
    diagnostics: [vscode.Uri, vscode.Diagnostic[]][],
  ): string {
    if (diagnostics.length === 0) return 'Without any diagnostics.';

    return diagnostics
      .map(([uri, diags]) => {
        const diagMessages = diags
          .map(
            (diag) =>
              `- **Message**: ${diag.message}\n` +
              `  - **Severity**: ${diag.severity}\n` +
              `  - **Range**: Line ${diag.range.start.line + 1}, Column ${
                diag.range.start.character + 1
              }\n` +
              `  - **Code**: ${diag.code || 'N/A'}\n`,
          )
          .join('\n');

        return `With some diagnostics:\n\n### ${path.basename(uri.fsPath)}\n\n${diagMessages}`;
      })
      .filter(Boolean)
      .join('\n');
  }
}
