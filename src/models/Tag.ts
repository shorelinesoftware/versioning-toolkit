import { ReleaseType, SemVer, cmp, coerce, parse, rcompare } from 'semver';

type TagArguments =
  | {
      prefix: string;
      version:
        | string
        | { major: number; minor: number; patch: number; prerelease?: string };
    }
  | string;

function tagComparer(tag1: Tag, tag2: Tag) {
  return rcompare(new SemVer(tag1.version), new SemVer(tag2.version));
}

export class Tag {
  constructor(args: TagArguments) {
    // eslint-disable-next-line no-console
    console.log('New TAG constructor - args = ', JSON.stringify(args));
    if (typeof args === 'string') {
      // eslint-disable-next-line no-console
      console.log('String - args = ', args);
      const tag = Tag.parse(args);
      // eslint-disable-next-line no-console
      console.log('tag = ', JSON.stringify(tag));
      if (tag == null) {
        // eslint-disable-next-line no-console
        console.log(
          'tag == null -> throw error - cannot be parsed - args = ',
          args,
        );
        throw new Error(`${args} can't be parsed into a tag`);
      }

      // eslint-disable-next-line no-console
      console.log('Gemerate semVer by tag version', JSON.stringify(tag));
      this._semVer = new SemVer(tag.version);
      this._prefix = tag.prefix;
      return;
    }
    if (!args.prefix) {
      // eslint-disable-next-line no-console
      console.log('!args.prefix => missing prefix');
      throw new Error(`missing prefix`);
    }
    if (!args.version) {
      // eslint-disable-next-line no-console
      console.log('!args.version => missing version');
      throw new Error(`missing version`);
    }
    try {
      if (typeof args.version === 'string') {
        // eslint-disable-next-line no-console
        console.log('String args.version');
        this._semVer = new SemVer(args.version);
        // eslint-disable-next-line no-console
        console.log(
          'String args.version -> SemVer = ',
          JSON.stringify(this._semVer),
        );
      } else {
        if (args.version.prerelease) {
          // eslint-disable-next-line no-console
          console.log('args.version.prerelease');
          this._semVer = new SemVer(
            `${args.version.major}.${args.version.minor}.${args.version.patch}-${args.version.prerelease}`,
          );
          // eslint-disable-next-line no-console
          console.log(
            'args.version.prerelease -> SemVer = ',
            JSON.stringify(this._semVer),
          );
        } else {
          // eslint-disable-next-line no-console
          console.log('NOT args.version.prerelease');
          this._semVer = new SemVer(
            `${args.version.major}.${args.version.minor}.${args.version.patch}`,
          );
          // eslint-disable-next-line no-console
          console.log(
            'NOT args.version.prerelease -> SemVer = ',
            JSON.stringify(this._semVer),
          );
        }
      }
    } catch {
      // eslint-disable-next-line no-console
      console.log(
        'THROW cannot be parsed into a version ',
        JSON.stringify(args.version),
      );
      throw new Error(`${args.version} can't be parsed into a version`);
    }
    // eslint-disable-next-line no-console
    console.log('this._prefix = ', args.prefix);
    this._prefix = args.prefix;
  }

  private readonly _prefix: string;
  private readonly _semVer: SemVer;

  get prefix(): string {
    return this._prefix;
  }
  get version(): string {
    return this._semVer.raw;
  }

  get majorSegment(): number {
    return this._semVer.major;
  }

  get minorSegment(): number {
    return this._semVer.minor;
  }
  get patchSegment(): number {
    return this._semVer.patch;
  }

  get prereleaseSegment(): string | undefined {
    // eslint-disable-next-line no-console
    console.log(
      'prereleaseSegment - this._semVer.prerelease = ',
      JSON.stringify(this._semVer.prerelease),
    );
    // eslint-disable-next-line no-console
    console.log('prereleaseSegment = ', this._semVer.prerelease[0]?.toString());
    return this._semVer.prerelease[0]?.toString();
  }

  get value(): string {
    return `${this.prefix}-${this._semVer.version}`;
  }

  private _bumpSegment(type: ReleaseType) {
    const newTag = this.copy();
    newTag._semVer.inc(type);

    // eslint-disable-next-line no-console
    console.log('_bumpSegment - newTag = ', JSON.stringify(newTag));
    return newTag;
  }

  copy(): Tag {
    return new Tag(this);
  }

  toString() {
    return this.value;
  }

  bumpPatchSegment() {
    return this._bumpSegment('patch');
  }

  bumpMinorSegment() {
    return this._bumpSegment('minor');
  }

  bumpMajorSegment() {
    return this._bumpSegment('major');
  }

  createBranch() {
    return `${this.prefix}-${this._semVer.major}.${this._semVer.minor}`;
  }

  isDefault() {
    return (
      this._semVer.major === 0 &&
      this._semVer.minor === 0 &&
      this._semVer.patch === 0
    );
  }

  resetPatchSegment() {
    return new Tag({
      prefix: this._prefix,
      version: {
        major: this.majorSegment,
        minor: this.minorSegment,
        patch: 0,
      },
    });
  }

  static getHighestTag(
    tags: Tag[],
    prefixOrTag?: string | Tag,
  ): Tag | undefined {
    if (!prefixOrTag) {
      // eslint-disable-next-line no-console
      console.log(
        'getHighestTag - !prefixOrTag - tags = ',
        JSON.stringify(tags),
      );
      tags.sort(tagComparer);
      return tags[0];
    }

    function getHighestTagByTag(tag: Tag) {
      // eslint-disable-next-line no-console
      console.log('getHighestTagByTag');
      const maxVersion = new SemVer(tag.version).inc('minor');
      // eslint-disable-next-line no-console
      console.log('getHighestTagByTag - maxVersion = ', maxVersion);
      const result = tags
        .filter(
          (currentTag) =>
            currentTag.prefix === tag.prefix &&
            cmp(new SemVer(currentTag.version), '<', maxVersion) &&
            cmp(new SemVer(currentTag.version), '>=', new SemVer(tag.version)),
        )
        .sort(tagComparer)[0];

      // eslint-disable-next-line no-console
      console.log('getHighestTagByTag - result = ', JSON.stringify(result));
      return result;
    }

    if (typeof prefixOrTag === 'string') {
      // eslint-disable-next-line no-console
      console.log('getHighestTag - prefixOrTag is string = ', prefixOrTag);
      const parsedTag = Tag.parse(prefixOrTag);
      // eslint-disable-next-line no-console
      console.log('getHighestTag - parsedTag = ', JSON.stringify(parsedTag));
      if (parsedTag != null) {
        // eslint-disable-next-line no-console
        console.log(
          'getHighestTag - parsedTag != null ',
          JSON.stringify(parsedTag),
        );
        return getHighestTagByTag(parsedTag);
      }
      // eslint-disable-next-line no-console
      console.log('getHighestTag - return tags = ', JSON.stringify(tags));
      return tags
        .filter((tag) => tag.prefix === prefixOrTag)
        .sort(tagComparer)[0];
    }
    return getHighestTagByTag(prefixOrTag);
  }

  static getHighestTagWithPrefixOrDefault(
    tags: Tag[],
    defaultPrefixOrTag?: never,
  ): Tag | undefined;

  static getHighestTagWithPrefixOrDefault(
    tags: Tag[],
    defaultPrefixOrTag: string | Tag,
  ): Tag;

  static getHighestTagWithPrefixOrDefault(
    tags: Tag[],
    defaultPrefixOrTag?: string | Tag,
  ) {
    // eslint-disable-next-line no-console
    console.log('getHighestTagWithPrefixOrDefault = ', {
      tags,
      defaultPrefixOrTag,
    });
    const highestTag = this.getHighestTag(tags, defaultPrefixOrTag);
    // eslint-disable-next-line no-console
    console.log(
      'getHighestTagWithPrefixOrDefault - highestTag = ',
      JSON.stringify(highestTag),
    );
    if (highestTag == null) {
      // eslint-disable-next-line no-console
      console.log('getHighestTagWithPrefixOrDefault - highestTag == null ');
      if (typeof defaultPrefixOrTag == 'string') {
        // eslint-disable-next-line no-console
        console.log(
          'getHighestTagWithPrefixOrDefault - highestTag == null - defaultPrefixOrTag is string ',
        );
        const tag = Tag.parse(defaultPrefixOrTag);
        // eslint-disable-next-line no-console
        console.log(
          'getHighestTagWithPrefixOrDefault - highestTag == null - defaultPrefixOrTag is string - tag = ',
          JSON.stringify(tag),
        );
        if (tag != null) {
          // eslint-disable-next-line no-console
          console.log(
            'getHighestTagWithPrefixOrDefault - highestTag == null - defaultPrefixOrTag is string - tag != null ',
            JSON.stringify(tag),
          );
          return tag;
        }
        if (!defaultPrefixOrTag) {
          // eslint-disable-next-line no-console
          console.log(
            'getHighestTagWithPrefixOrDefault - !defaultPrefixOrTag ',
          );
          return undefined;
        }

        // eslint-disable-next-line no-console
        console.log(
          'getHighestTagWithPrefixOrDefault - highestTag == null - defaultPrefixOrTag is string => returns tag with prefix = deFaultProfixOrTag, version 0.0.0',
        );
        return new Tag({ prefix: defaultPrefixOrTag, version: '0.0.0' });
      }
      return defaultPrefixOrTag?.copy();
    }
    return highestTag;
  }

  static getPreviousTag(tags: Tag[], currentTag: Tag): Tag | undefined {
    return [...tags]
      .sort(tagComparer)
      .filter(
        (tag) =>
          tag.prefix === currentTag.prefix &&
          cmp(new SemVer(tag.version), '<', new SemVer(currentTag.version)),
      )[0];
  }

  static parse(tagOrBranch: string): Tag | undefined {
    // eslint-disable-next-line no-console
    console.log('parse');
    const versionStartRegexp = /-\d+\./;
    const versionAndPrereleaseStartIndex =
      tagOrBranch.search(versionStartRegexp);
    if (versionAndPrereleaseStartIndex === -1) {
      // eslint-disable-next-line no-console
      console.log('parse - versionAndPrereleaseStartIndex === -1');
      return undefined;
    }
    const [version, prerelease] = tagOrBranch
      .substring(versionAndPrereleaseStartIndex + 1)
      .split('-');
    const prefix = tagOrBranch.substring(0, versionAndPrereleaseStartIndex);
    // eslint-disable-next-line no-console
    console.log('parse - prefix = ', prefix);
    if (!version || !prefix) {
      // eslint-disable-next-line no-console
      console.log('parse - !version || !prefix');
      return undefined;
    }

    // eslint-disable-next-line no-console
    console.log('parse - coercing version = ', version);
    const coercedVersion = coerce(version, { loose: true });

    // eslint-disable-next-line no-console
    console.log('parse - coercedVersion = ', coercedVersion);

    if (coercedVersion == null) {
      // eslint-disable-next-line no-console
      console.log('parse - coercedVersion == null');
      return undefined;
    }
    let semVer: SemVer | null = coercedVersion;
    if (prerelease != null) {
      // eslint-disable-next-line no-console
      console.log('parse - prerelease != null ', prerelease);
      semVer = parse([coercedVersion.raw, prerelease].join('-'));
      // eslint-disable-next-line no-console
      console.log(
        'parse - prerelease != null - semVer ',
        JSON.stringify(semVer),
      );
    }
    if (semVer == null) {
      // eslint-disable-next-line no-console
      console.log('parse - semVer == null');
      return undefined;
    }

    // eslint-disable-next-line no-console
    console.log('parse - return result ', {
      prefix: prefix.toString(),
      version: semVer.raw,
    });
    return new Tag({ prefix: prefix.toString(), version: semVer.raw });
  }
}
