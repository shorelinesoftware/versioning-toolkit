import { Tag } from '../Tag';

const tags = [
  Tag.parse('master-0.0.0'),
  Tag.parse('master-0.1.1'),
  Tag.parse('master-0.1.0'),
  Tag.parse('master-1.1.0'),
  Tag.parse('master-0.0.1'),
  Tag.parse('stable-1.0.0'),
  Tag.parse('stable-2.0.0'),
  Tag.parse('stable-2.1.0'),
  Tag.parse('stable-2.2.0'),
  Tag.parse('stable-2.2.1'),
  Tag.parse('stable-2.2.2'),
  Tag.parse('stable-2.2.3'),
  Tag.parse('stable-2.3.0'),
  Tag.parse('stable-2.3.1'),
  Tag.parse('stable-0.1.0'),
].filter((tag): tag is Tag => tag !== null);

describe('Tag', () => {
  it('toString to return string tag representation', () => {
    const expected = 'master-0.0.0';
    expect(String(new Tag('master-0.0.0'))).toBe(expected);
  });
  it('value has string tag representation', () => {
    const expected = 'master-0.0.0';
    expect(new Tag('master-0.0.0').value).toBe(expected);
  });
  it('constructor creates tag', () => {
    const tag1 = new Tag('master-0.0.0');
    const tag2 = new Tag({ prefix: 'master', version: '0.0.0' });
    expect(tag1.value).toBe(tag2.value);
    expect(tag1.value).toBe('master-0.0.0');
  });
  it('constructor throws exception if args are invalid', () => {
    expect(() => new Tag('0.0.0')).toThrow(`0.0.0 can't be parsed into a tag`);
    expect(() => new Tag({ prefix: 'master', version: 'master' })).toThrow(
      `master can't be parsed into a version`,
    );
  });

  describe('parse', () => {
    it.each([
      {
        tagOrBranch: 'master-0.0.0',
        expected: new Tag('master-0.0.0'),
      },
      {
        tagOrBranch: 'master-1.0.0',
        expected: new Tag('master-1.0.0'),
      },
      {
        tagOrBranch: 'master-1.1.0',
        expected: new Tag('master-1.1.0'),
      },
      {
        tagOrBranch: 'master-1.1.0-abc',
        expected: new Tag('master-1.1.0-abc'),
      },
    ])('parses tag($tagOrBranch)', ({ tagOrBranch, expected }) => {
      const actual = Tag.parse(tagOrBranch);
      expect(actual?.value).toBe(expected.value);
    });
    it.each([
      {
        tagOrBranch: 'master-0.0',
        expected: 'master-0.0.0',
      },
      {
        tagOrBranch: 'master-0',
        expected: 'master-0.0.0',
      },
      {
        tagOrBranch: 'feature-1.0',
        expected: 'feature-1.0.0',
      },
      {
        tagOrBranch: 'stable-1.1',
        expected: 'stable-1.1.0',
      },
    ])(
      'parses branch($tagOrBranch) into $expected',
      ({ tagOrBranch, expected }) => {
        const actual = Tag.parse(tagOrBranch);
        expect(actual?.value).toBe(expected);
      },
    );
    it.each([
      {
        tagOrBranch: 'master',
        expected: undefined,
      },
      {
        tagOrBranch: '1.1.0',
        expected: undefined,
      },
      {
        tagOrBranch: '1',
        expected: undefined,
      },
    ])(
      'returns undefined if can not parse ($tagOrBranch)',
      ({ tagOrBranch, expected }) => {
        const actual = Tag.parse(tagOrBranch);
        expect(actual).toStrictEqual(expected);
      },
    );
  });

  describe('getHighestTag', () => {
    it('should get tag with the highest version', async () => {
      const tag = Tag.getHighestTag(tags);
      expect(tag?.value).toBe('stable-2.3.1');
    });
    it('should get tag with the highest version by prefix', async () => {
      const tag = Tag.getHighestTag(tags, 'master');
      expect(tag?.value).toBe('master-1.1.0');
    });
    it('should get tag with the highest version by tag like prefix', async () => {
      const tag = Tag.getHighestTag(tags, 'master-1.1.0');
      expect(tag?.value).toBe('master-1.1.0');
    });
    it('should get tag with the highest version by tag', async () => {
      const tag1 = Tag.getHighestTag(tags, Tag.parse('stable-2.2'));
      expect(tag1?.value).toBe('stable-2.2.3');
      const tag2 = Tag.getHighestTag(tags, Tag.parse('master-0.1'));
      expect(tag2?.value).toBe('master-0.1.1');
    });
    it('should not get tag with lower than tag version', async () => {
      const tag = Tag.getHighestTag(tags, Tag.parse('stable-3.0'));
      expect(tag).toBe(undefined);
    });
  });

  describe('getHighestTagOrDefault', () => {
    it('should return default tag by prefix', () => {
      const tag = Tag.getHighestTagOrDefault(tags, 'feature');
      expect(tag?.value).toBe('feature-0.0.0');
    });
    it('should return default tag if no tags found', () => {
      const tag = Tag.getHighestTagOrDefault(tags, new Tag('feature-1.0.1'));
      expect(tag?.value).toBe('feature-1.0.1');
    });
    it('should return tag with the highest version', () => {
      const tag = Tag.getHighestTagOrDefault(tags);
      expect(tag?.value).toBe('stable-2.3.1');
    });
  });

  describe('createBranch', () => {
    it('creates branch from tag', () => {
      const tag = Tag.parse('master-0.0.1');
      if (tag == null) {
        throw new Error(`tag master-0.0.1 can't be parsed`);
      }
      const actual = tag.createBranch();
      expect(actual).toBe('master-0.0');
    });
  });

  describe('bump', () => {
    it('bumps patch segment', async () => {
      const currentTag = new Tag('master-1.1.0');
      const actual = currentTag.bumpPatchSegment();
      const expected = 'master-1.1.1';
      expect(actual.value).toBe(expected);
      expect(currentTag.value).not.toBe(expected);
    });
    it('bumps minor segment', async () => {
      const currentTag = new Tag('master-1.1.1');
      const actual = currentTag.bumpMinorSegment();
      const expected = 'master-1.2.0';
      expect(actual.value).toBe(expected);
      expect(currentTag.value).not.toBe(expected);
    });
    it('bumps major segment', async () => {
      const currentTag = new Tag('master-1.1.1');
      const actual = currentTag.bumpMajorSegment();
      const expected = 'master-2.0.0';
      expect(actual.value).toBe(expected);
      expect(currentTag.value).not.toBe(expected);
    });
  });

  describe('copy', () => {
    it('makes tag copy', () => {
      const tag = new Tag('master-1.1.1');
      const tagCopy = tag.copy();
      expect(tag).not.toBe(tagCopy);
      expect(tag).toStrictEqual(tagCopy);
    });
  });
});
