import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Alert } from "@/components/ui/Alert";
import { Tabs } from "@/components/layout/Tabs";
import { PackageForm } from "./PackageForm";
import { PACKAGE_FORM_TABS } from "./packageFormTabs";
import type { PackageFormValues } from "@/types/package";

interface PackageCreateDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PackageFormValues) => void;
  isLoading: boolean;
  error?: string | null;
  onDismissError?: () => void;
}

// Wraps the existing standalone (tabbed) PackageForm in a wide Drawer for
// inline use from a Packages picker (Testimonial's packageIds, Package's own
// customRelatedIds). Same full form, same validation — Package genuinely has
// no fields that could be trimmed for a "quick" version.
export function PackageCreateDrawer({ isOpen, onClose, onSubmit, isLoading, error, onDismissError }: PackageCreateDrawerProps) {
  const [tab, setTab] = useState(PACKAGE_FORM_TABS[0].value);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="New Package" size="xl">
      <div className="space-y-4">
        {error && <Alert variant="error" message={error} onClose={onDismissError} />}
        <Tabs tabs={PACKAGE_FORM_TABS} value={tab} onChange={setTab} />
        <PackageForm onSubmit={onSubmit} isLoading={isLoading} submitLabel="Create Package" activeTab={tab} />
      </div>
    </Drawer>
  );
}
