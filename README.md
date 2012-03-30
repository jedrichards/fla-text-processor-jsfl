# HogarthAutomationJSFL

JSFL scripts for automating the processing of banner FLAs for translation.

## Outline

The JSFL scripts run within the Flash IDE environment and operate on FLAs. They are also capable of parsing and outputting XML and publishing SWFs.

In the first step an FLA is taken as input, tidied up, prepared and scanned for translatable text which is outputted as XML. The XML can then be translated by a 3rd party and finally imported back into the FLA.

## Considerations

### Environment

- Developed using Flash CS5.5 11.5.1.349 and AS2 FLAs.
- The scripts are untested on AS3 content but should work fine.
- Keep the IDE up to date with the latest updates from Adobe to minimise bugs.
- JSFL scripts can be executed from the command line in OSX via `open myscript.jsfl`. This will open Flash if it isn't already and run the script.
- There is no way to pass parameters from the command line into the JSFL script, so an external tool will need to modify the JSFL script directly before it is run if dynamic values need to be passed in.
- On OSX JSFL scripts understand file paths in the format `file:///absolute/path/to/myfile`.
- On OSX Flash will expose in its Commands menu any JSFL scripts it finds in the following location `Macintosh\ HD/Users/{username}/Library/Application\ Support/Adobe/Flash\ CS5.5/en_US/Configuration/Commands/`.

### FLA structure

- Only static TextFields are supported, not dynamic or input. There is no way to predict the text content of a dynamic or input TextField since it can be modified by ActionScript and additionally font embedding is more complex and prone to bloating the SWF file size.
- Since there is no way to uniquely identify a static TextField in an FLA (they aren't library symbols and don't have instance names) all static TextFields should be wrapped in a matching MovieClip which are named via an id which is carried through into the XML. The script uses an id format tf*n* where *n* is an incrementing integer. These MovieClip wrappers are called *translatable MovieClips* in the terminology of these scripts.
- To be properly formatted a translatable MovieClip should follow the naming convention tf*n* and contain a single layer, a single key frame and a single static TextField. Any static TextFields in the FLA not wrapped in such a MovieClip will be automatically wrapped and fixed by the script. To achieve as robust and tidy FLA as possible the master file should be prepared in advance with properly formatted translatable MovieClips before processing.
- If multiple unwrapped static TextFields appear *with the same text content* at different points on the timeline the script will generate multiple translateable MovieClips and multiple translation items in the XML with the same content, which is undesirable. To avoid this follow good Flash design practice and convert TextFields with the same formatting and content into one MovieClip symbol for re-use throughout the FLA.
- TextFields that appear either on the maintime or nested in a symbol an ancestor of which also appears on the maintime are all picked up by the script. The script will also find and process TextFields that appear in MovieClips that are exported for ActionScript. Any MovieClips (and any TextFields contained therein) which do not appear on the timeline, have a zero use count and are not exported for ActionScript are discarded by the script.

### Text formatting

- The script is capable of analysing in-line styles found in the static TextFields and converting these to simple HTML tags which are included in the XML as CDATA. This formatting information can be carried forward through the translation process and then re-applied to the static TextFields when re-importing the translated XML.
- Currently supported are line-breaks, font type, font size, colour, bold and italic. The scripts are not capable of parsing arbitrary HTML, only formatting HTML of the type and sctructure generated by the scripts should be imported.
- Care should be taken to format text within the static TextFields *sensibly* and *simply*.
- Do not mix too many inline styles/formatting inside the same TextField, it'll make the translation XML overly complicated.
- Do not include a lot of whitespace in a TextField- if you need to move text down a few lines don't add multiple line breaks move the whole Textfield instead.
- Do not change the alignment of text inline in the same TextField, instead consider breaking out text that has different alignments into seperate TextFields.
- The scripts are also capable of outputting simple raw text strings with no HTML formatting, in which case line breaks and whitespace are stripped.
- Text will wrap at the width of the static TextField, so care should be taken to ensure TextFields are set to the correct width while considering the fact that translated text content may be much longer.

### FLA tidying

- The FLA is "tidied" during processing.
- Symbols with a zero use count that aren't exported for ActionScript are deleted.
- Library items are moved into descriptive folders ("movieclips", "bitmaps", "graphics" etc.).
- Empty library folders are deleted.
- All translatable MovieClips are added to a sprite sheet MovieClip called "TranslatableTextMC" for easy access.

### Logging and locking

- The scripts will create a lockfile on the filesystem while they run, and delete it once the script has exited and Flash has finished processing.
- If the script crashes midway through the lockfile will remain and serves as an indicator that something went wrong.
- The script can log progress messages, warnings and critical errors to a log file.
- It's possible that the script encountered critical problems that didn't cause it to crash but should be reported so always check the log.

### Fonts, class files, components and extensions

- The system executing the JSFLs will need to have the correct fonts installed to properly publish the SWFs.
- If the FLAs make use of any external class files these will have to be uploaded alongside the FLA to the correct folder position relative to the FLA.
- If the FLAs make use of any extensions (for example ad serving platform extensions) these may also have to be installed onto the IDE.
- If the FLAs need to be exported via a specialist Flash IDE extension (for example Eyeblaster Workshop) this may have to be completed in a manual step.

### Caveats

- RTL text is not supported. RTL text is only achievable in AS3 FLAs using Text Layout Framework (TLF) TextFields. TLF TextFields are not currently accessible via the JSFL API. Any conversion to RTL will have to be completed in a manual step after importing.
- TextFields that have been grouped together with other symbols on the stage may be skipped by the script - consider breaking apart any groups containing TextFields in the master file.
- Only static TextFields are considered translatable, dynamic and input TextFields are skipped.