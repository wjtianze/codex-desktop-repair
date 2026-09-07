# Security and integrity

## Development-time command-line detection

On September 7, 2026, at 12:26 local time (UTC+8), Microsoft Defender reported **Trojan:Win32/PowhidSubExec.B** for a PowerShell command used to generate installation scripts. The detected resource was a command line. The corresponding record reported successful remediation, no execution, and an inactive state afterward.

The record was traced to that development operation. Identifying its origin does not establish safety, and no Microsoft false-positive determination was obtained. The release workflow was changed to visible local verification, removing hidden PowerShell launchers and execution-policy bypass. Real-time protection and behavior monitoring were not disabled, and no exclusions were added.

Current scan and execution results are documented in [validation](VALIDATION.md). A clean scan does not guarantee that every security product will give the same result. If a detection occurs, stop installation and retain its details instead of allowing it automatically.

Microsoft's [detection-update record](https://www.microsoft.com/en-us/wdsi/definitions/antimalware-definition-release-notes?Version=1.161.256.0) includes the detection name. That does not establish that the project's command was the corresponding malware sample.

## Installer behavior

- Use the installed official client after checking its version, official signature, and SHA-256 hashes.
- Build a separate copy in the user directory. Each patch checks the input digest, replacement offsets, inserted bytes, and output digest.
- Rebuild resource integrity metadata and verify every packed entry. Only the executable's resource-header digest record changes, which invalidates the copied executable's official signature.
- Keep file backups and a transaction record for each installation. Check for subsequent file changes before restoring.
- Modify browser-component caches only when their versions and hashes match. Credentials and conversation databases are excluded from release packages.

The repair tools have no third-party package dependencies. Installation does not download executable files from the network. Startup verification remains visible, and the actual app runs from the local runtime copy.

The English edition translates documentation, entry-command names, project-owned sidebar labels, and console messages. It uses a separate release identifier and regenerated integrity hashes. The original Chinese branch and the user's active Chinese installation are preserved.
