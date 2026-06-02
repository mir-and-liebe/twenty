import { t } from '@lingui/core/macro';
import { useContext, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppPath,
  CoreObjectNameSingular,
  type RecordGqlOperationOrderBy,
} from 'twenty-shared/types';
import { getAppPath } from 'twenty-shared/utils';
import { IconChevronDown, IconChevronRight } from 'twenty-ui/display';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';
import { useIsMobile } from 'twenty-ui/utilities';

import { type Dashboard } from '@/dashboards/components/types/Dashboard';
import { openNavigationMenuItemFolderIdsState } from '@/navigation-menu-item/common/states/openNavigationMenuItemFolderIdsState';
import { NavigationMenuItemFolderLayout } from '@/navigation-menu-item/display/folder/components/NavigationMenuItemFolderLayout';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import {
  NavigationDrawerItem,
  type NavigationDrawerItemProps,
} from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import { NavigationDrawerSubItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerSubItem';
import { getNavigationSubItemLeftAdornment } from '@/ui/navigation/navigation-drawer/utils/getNavigationSubItemLeftAdornment';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';

const DASHBOARD_NAVIGATION_FOLDER_ID = 'dashboard-navigation-records';

type DashboardNavigationDrawerItemProps = {
  label: string;
  navigationPath: string;
  isActive: boolean;
  Icon: NavigationDrawerItemProps['Icon'];
  iconColor?: string | null;
};

export const DashboardNavigationDrawerItem = ({
  label,
  navigationPath,
  isActive,
  Icon,
  iconColor,
}: DashboardNavigationDrawerItemProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const { theme } = useContext(ThemeContext);
  const [openNavigationMenuItemFolderIds, setOpenNavigationMenuItemFolderIds] =
    useAtomState(openNavigationMenuItemFolderIdsState);
  const [isManuallyClosed, setIsManuallyClosed] = useState(false);

  const { records: dashboards } = useFindManyRecords<Dashboard>({
    objectNameSingular: CoreObjectNameSingular.Dashboard,
    orderBy: [{ title: 'AscNullsLast' }] satisfies RecordGqlOperationOrderBy,
    recordGqlFields: {
      id: true,
      title: true,
      pageLayoutId: true,
    },
    limit: 50,
  });

  const dashboardSubItems = useMemo(
    () => [
      {
        id: 'all-dashboards',
        label: t`All Dashboards`,
        path: navigationPath,
      },
      ...dashboards.map((dashboard) => ({
        id: dashboard.id,
        label: dashboard.title,
        path: getAppPath(AppPath.RecordShowPage, {
          objectNameSingular: CoreObjectNameSingular.Dashboard,
          objectRecordId: dashboard.id,
        }),
      })),
    ],
    [dashboards, navigationPath],
  );

  const selectedSubItemIndex = dashboardSubItems.findIndex(
    (item) => item.path.split('?')[0] === location.pathname,
  );
  const hasActiveChild = selectedSubItemIndex >= 0;
  const isExplicitlyOpen = openNavigationMenuItemFolderIds.includes(
    DASHBOARD_NAVIGATION_FOLDER_ID,
  );
  const isOpen =
    isExplicitlyOpen || (hasActiveChild && isManuallyClosed === false);

  const handleToggle = () => {
    if (isOpen) {
      setOpenNavigationMenuItemFolderIds((current) =>
        current.filter((id) => id !== DASHBOARD_NAVIGATION_FOLDER_ID),
      );
      setIsManuallyClosed(true);

      return;
    }

    setOpenNavigationMenuItemFolderIds((current) =>
      current.includes(DASHBOARD_NAVIGATION_FOLDER_ID)
        ? current
        : [...current, DASHBOARD_NAVIGATION_FOLDER_ID],
    );
    setIsManuallyClosed(false);
    navigate(navigationPath);
  };

  return (
    <NavigationMenuItemFolderLayout
      header={
        <NavigationDrawerItem
          label={label}
          Icon={Icon}
          iconColor={iconColor}
          active={!isOpen && (isActive || hasActiveChild)}
          onClick={handleToggle}
          className="navigation-drawer-item"
          triggerEvent="CLICK"
          preventCollapseOnMobile={isMobile}
          alwaysShowRightOptions
          rightOptions={
            isOpen ? (
              <IconChevronDown
                size={theme.icon.size.sm}
                stroke={theme.icon.stroke.sm}
                color={themeCssVariables.font.color.tertiary}
              />
            ) : (
              <IconChevronRight
                size={theme.icon.size.sm}
                stroke={theme.icon.stroke.sm}
                color={themeCssVariables.font.color.tertiary}
              />
            )
          }
        />
      }
      isOpen={isOpen}
      isGroup={false}
    >
      {dashboardSubItems.map((item, index) => (
        <NavigationDrawerSubItem
          key={item.id}
          label={item.label}
          Icon={Icon}
          iconColor={iconColor}
          to={item.path}
          active={selectedSubItemIndex === index}
          subItemState={getNavigationSubItemLeftAdornment({
            index,
            arrayLength: dashboardSubItems.length,
            selectedIndex: selectedSubItemIndex,
          })}
          triggerEvent="CLICK"
        />
      ))}
    </NavigationMenuItemFolderLayout>
  );
};
