import { type FlatApplication } from 'src/engine/core-modules/application/types/flat-application.type';
import { type FlatNavigationMenuItem } from 'src/engine/metadata-modules/flat-navigation-menu-item/types/flat-navigation-menu-item.type';

export const getNavigationMenuItemFlatEntitySeeds = ({
  workspaceId: _workspaceId,
  flatApplication: _flatApplication,
}: {
  workspaceId: string;
  flatApplication: FlatApplication;
}): FlatNavigationMenuItem[] => {
  return [];
};
