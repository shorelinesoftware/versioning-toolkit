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
    if (typeof args === 'string') {
      const tag = Tag.parse(args);
      if (tag == null) {
        throw new Error(`${args} can't be parsed into a tag`);
      }
      this._semVer = new SemVer(tag.version);
      this._prefix = tag.prefix;
      return;
    }
    if (!args.prefix) {
      throw new Error(`missing prefix`);
    }
    if (!args.version) {
      throw new Error(`missing version`);
    }
    try {
      if (typeof args.version === 'string') {
        this._semVer = new SemVer(args.version);
      } else {
        if (args.version.prerelease) {
          this._semVer = new SemVer(
            `${args.version.major}.${args.version.minor}.${args.version.patch}-${args.version.prerelease}`,
          );
        } else {
          this._semVer = new SemVer(
            `${args.version.major}.${args.version.minor}.${args.version.patch}`,
          );
        }
      }
    } catch {
      throw new Error(`${args.version} can't be parsed into a version`);
    }
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
    return this._semVer.prerelease[0]?.toString();
  }

  get value(): string {
    return `${this.prefix}-${this._semVer.version}`;
  }

  private _bumpSegment(type: ReleaseType) {
    const newTag = this.copy();
    newTag._semVer.inc(type);
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
      tags.sort(tagComparer);
      return tags[0];
    }

    function getHighestTagByTag(tag: Tag) {
      const maxVersion = new SemVer(tag.version).inc('minor');
      return tags
        .filter(
          (currentTag) =>
            currentTag.prefix === tag.prefix &&
            cmp(new SemVer(currentTag.version), '<', maxVersion) &&
            cmp(new SemVer(currentTag.version), '>=', new SemVer(tag.version)),
        )
        .sort(tagComparer)[0];
    }

    if (typeof prefixOrTag === 'string') {
      const parsedTag = Tag.parse(prefixOrTag);
      if (parsedTag != null) {
        return getHighestTagByTag(parsedTag);
      }
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
    const highestTag = this.getHighestTag(tags, defaultPrefixOrTag);
    if (highestTag == null) {
      if (typeof defaultPrefixOrTag == 'string') {
        const tag = Tag.parse(defaultPrefixOrTag);
        if (tag != null) {
          return tag;
        }
        if (!defaultPrefixOrTag) {
          return undefined;
        }
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
    const versionStartRegexp = /-\d+\./;
    const versionAndPrereleaseStartIndex =
      tagOrBranch.search(versionStartRegexp);
    if (versionAndPrereleaseStartIndex === -1) {
      return undefined;
    }
    const [version, prerelease] = tagOrBranch
      .substring(versionAndPrereleaseStartIndex + 1)
      .split('-');
    const prefix = tagOrBranch.substring(0, versionAndPrereleaseStartIndex);
    if (!version || !prefix) {
      return undefined;
    }

    const coercedVersion = coerce(version, { loose: true });
    if (coercedVersion == null) {
      return undefined;
    }
    let semVer: SemVer | null = coercedVersion;
    if (prerelease != null) {
      semVer = parse([coercedVersion.raw, prerelease].join('-'));
    }
    if (semVer == null) {
      return undefined;
    }
    return new Tag({ prefix: prefix.toString(), version: semVer.raw });
  }
}
