import { ReleaseType, SemVer, cmp, coerce, parse, rcompare } from 'semver';

type TagArguments =
  | {
      prefix: string;
      version: string;
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
    try {
      this._semVer = new SemVer(args.version);
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

  static getHighestTag(
    tags: Tag[],
    prefixOrTag?: string | Tag,
  ): Tag | undefined {
    if (!prefixOrTag) {
      tags.sort(tagComparer);
      return tags[0];
    }
    if (typeof prefixOrTag === 'string') {
      const parsedTag = Tag.parse(prefixOrTag);
      if (parsedTag != null) {
        return getHigestTagByTag(parsedTag);
      }
      return tags
        .filter((tag) => tag.prefix === prefixOrTag)
        .sort(tagComparer)[0];
    }

    function getHigestTagByTag(tag: Tag) {
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

    return getHigestTagByTag(prefixOrTag);
  }

  static getHighestTagOrDefault(
    tags: Tag[],
    defaultPrefixOrTag?: string | Tag,
  ) {
    const prevTag = this.getHighestTag(tags, defaultPrefixOrTag);
    if (prevTag == null) {
      if (typeof defaultPrefixOrTag == 'string') {
        const tag = Tag.parse(defaultPrefixOrTag);
        if (tag != null) {
          return tag;
        }
        return new Tag({ prefix: defaultPrefixOrTag, version: '0.0.0' });
      }
      return defaultPrefixOrTag?.copy();
    }
    return prevTag;
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
    if (version == null || prefix == null) {
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
