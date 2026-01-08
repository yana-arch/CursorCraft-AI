import JSZip from 'jszip';

export const generateWindowsInstallerZip = async (cursorBlob: Blob, filename: string, type: 'cur' | 'ani'): Promise<Blob> => {
    const zip = new JSZip();
    const cursorFileName = filename + (type === 'cur' ? '.cur' : '.ani');
    
    // Add the cursor file
    zip.file(cursorFileName, cursorBlob);

    // Create a simple INF file for installation
    const infContent = `
[Version]
signature="$CHICAGO$"

[DefaultInstall]
CopyFiles = Scheme.Cur, Scheme.Txt
AddReg    = Scheme.Reg

[DestinationDirs]
Scheme.Cur = 10,"%CUR_DIR%"
Scheme.Txt = 10,"%CUR_DIR%"

[Scheme.Reg]
HKCU,"Control Panel\\Cursors\\Schemes","%SCHEME_NAME%",,"%10%\\%CUR_DIR%\\%POINTER%,%10%\\%CUR_DIR%\\%POINTER%,%10%\\%CUR_DIR%\\%POINTER%,%10%\\%CUR_DIR%\\%POINTER%,%10%\\%CUR_DIR%\\%POINTER%,%10%\\%CUR_DIR%\\%POINTER%,%10%\\%CUR_DIR%\\%POINTER%,%10%\\%CUR_DIR%\\%POINTER%,%10%\\%CUR_DIR%\\%POINTER%,%10%\\%CUR_DIR%\\%POINTER%,%10%\\%CUR_DIR%\\%POINTER%,%10%\\%CUR_DIR%\\%POINTER%,%10%\\%CUR_DIR%\\%POINTER%,%10%\\%CUR_DIR%\\%POINTER%,%10%\\%CUR_DIR%\\%POINTER%"

[Strings]
CUR_DIR       = "Cursors\\${filename}"
SCHEME_NAME   = "${filename}"
POINTER       = "${cursorFileName}"
`;

    zip.file("install.inf", infContent);

    // Add a Readme
    zip.file("README.txt", `
${filename} Cursor Installer
----------------------------
1. Extract this zip file to a folder.
2. Right-click on 'install.inf' and select 'Install'.
3. Go to Mouse Settings > Pointers and select '${filename}' from the Scheme dropdown.
4. Apply.
    `);

    return await zip.generateAsync({type: "blob"});
};