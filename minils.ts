const color: {
  Blue: string;
  Reset: string;
} = { Blue: "\u001b[34m", Reset: "\u001b[0m" };

const parts: {
  OneSpace: string;
  Slash: string;
  NewLine: string;
  Dot: string;
  Empty: string;
} = { OneSpace: " ", Slash: "/", NewLine: "\n", Dot: ".", Empty: "" };

interface OSOriginListEntry extends Deno.DirEntry {
  name: string;
}

interface DotCheckedMax {
  entry: OSOriginListEntry;
  size: number;
}

interface EditedDotCheckedMax {
  entry: OSOriginListEntry;
  size: number;
}

interface ViewMatrix {
  rowsize: number;
  colsize: number;
}

type Print = typeof print;

const print = (filename: string, next: boolean) => {
  if (next) {
    Deno.stdout.write(new TextEncoder().encode(filename + parts.NewLine));
  } else {
    Deno.stdout.write(new TextEncoder().encode(filename));
  }
};

const dotCheck = (filename: string) => {
  if (filename.indexOf(parts.Dot)) {
    return true;
  }
  return false;
};

const pathCheck = (path: string) => {
  if (path === undefined) {
    return parts.Dot;
  }
  return path;
};

const tpusCols = async () => {
  const cmd = Deno.run({ cmd: ["tput", "cols"], stdout: "piped" });
  const columnsUintArray = await cmd.output();
  cmd.close();

  // Decode geted window size with tput cols and cast from decoded string to number
  return Number(new TextDecoder().decode(columnsUintArray));
};

const main = async (path: string, windowsize: number, callback: Print) => {
  const OSEntriesWithoutDotfiles: OSOriginListEntry[] = [];
  for await (const directoryEntry of Deno.readDir(pathCheck(path))) {
    if (dotCheck(directoryEntry.name)) {
      OSEntriesWithoutDotfiles.push(directoryEntry);
    }
  }

  // initialize Max
  const maxentry = OSEntriesWithoutDotfiles.reduce((a, b) =>
    a.name.length > b.name.length ? a : b
  );
  const Max: DotCheckedMax = {
    entry: maxentry,
    size: maxentry.name.length,
  };
  const EditedMax: EditedDotCheckedMax = { entry: Max.entry, size: Max.size };
  EditedMax.size += 2;

  // calc col and row size
  const Matrix: ViewMatrix = { rowsize: 0, colsize: 0 };
  Matrix.colsize = Math.floor(windowsize / EditedMax.size);
  Matrix.rowsize = Math.ceil(OSEntriesWithoutDotfiles.length / Matrix.colsize);

  // extract 2 vector directory entry from 1 vector directory entry
  OSEntriesWithoutDotfiles.sort((a, b) => (a.name > b.name ? 1 : -1));
  for (let i = 0; i < Matrix.rowsize; i++) {
    if (i != 0) {
      callback(parts.Empty, true);
    }
    for (let j = i; j < Matrix.colsize * Matrix.rowsize; j += Matrix.rowsize) {
      if (OSEntriesWithoutDotfiles[j] === undefined) {
        break;
      }
      // region layout
      const addSize = Max.size - OSEntriesWithoutDotfiles[j].name.length;
      let sizewithslash = 1;
      if (OSEntriesWithoutDotfiles[j].isDirectory) {
        OSEntriesWithoutDotfiles[j].name =
          color.Blue +
          OSEntriesWithoutDotfiles[j].name +
          color.Reset +
          parts.Slash;
        sizewithslash -= 1;
      }
      for (let k = 0; k <= addSize + sizewithslash; k++) {
        OSEntriesWithoutDotfiles[j].name += parts.OneSpace;
      }
      // endregion layout
      callback(OSEntriesWithoutDotfiles[j].name, false);
    }
  }
};

try {
  // top level await with Deno
  const windowsize = await tpusCols();
  await main(Deno.args[0], windowsize, print);
  print(parts.Empty, true);
} catch (e) {
  console.error(e.message);
}

