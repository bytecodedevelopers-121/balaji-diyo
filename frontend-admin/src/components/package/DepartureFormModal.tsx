import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { toNumber } from "@/lib/decimal";
import type { Departure } from "@/types/departure";

/** Always fully populated on submit (the schema requires these fields for both create and edit). */
export interface DepartureFormSubmitValues {
  departureDate: string;
  departureCost: number;
  departureStatus: string;
  departureNote?: string;
}

const schema = z.object({
  departureDate: z.string().min(1, "Date is required"),
  departureCost: z.number().min(0, "Cost is required"),
  departureStatus: z.string().min(1, "Status is required"),
  departureNote: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface DepartureFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  departure?: Departure | null;
  onSubmit: (data: DepartureFormSubmitValues) => void;
  isLoading: boolean;
}

export function DepartureFormModal({ isOpen, onClose, departure, onSubmit, isLoading }: DepartureFormModalProps) {
  const isEdit = !!departure;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      departureDate: departure?.departureDate?.slice(0, 10) ?? "",
      departureCost: toNumber(departure?.departureCost) ?? 0,
      departureStatus: departure?.departureStatus ?? "",
      departureNote: departure?.departureNote ?? "",
    },
  });

  const submit = (values: FormValues) => {
    onSubmit({
      departureDate: values.departureDate,
      departureCost: values.departureCost,
      departureStatus: values.departureStatus,
      departureNote: values.departureNote || undefined,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Departure" : "New Departure"}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} isLoading={isLoading}>
            {isEdit ? "Save Changes" : "Add Departure"}
          </Button>
        </div>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(submit)}>
        <Input label="Date" type="date" required error={errors.departureDate?.message} {...register("departureDate")} />
        <Input label="Cost" type="number" step="0.01" required error={errors.departureCost?.message} {...register("departureCost", { valueAsNumber: true })} />
        <Input
          label="Status"
          required
          hint='e.g. "Guaranteed", "Open", "Full", "Cancelled"'
          error={errors.departureStatus?.message}
          {...register("departureStatus")}
        />
        <Textarea label="Note" rows={2} error={errors.departureNote?.message} {...register("departureNote")} />
      </form>
    </Modal>
  );
}
