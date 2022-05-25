import { Tag } from '../models/Tag';
import { ActionAdapter } from './actionAdapter';

export function processTag(
  newTag: Tag,
  isTagPushed: boolean,
  actionAdapter: ActionAdapter,
) {
  actionAdapter.info(`new tag: ${newTag}`);
  if (isTagPushed) {
    actionAdapter.info(`pushed new tag ${newTag}`);
  }
  actionAdapter.setOutput('NEW_TAG', newTag.value);
}
