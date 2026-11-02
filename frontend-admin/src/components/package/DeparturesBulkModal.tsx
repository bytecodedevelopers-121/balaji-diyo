import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Repeater } from "@/components/form/Repeater";
import type { CreateDeparturesBulkDto } from "@/types/departure";

const rowSchema = z.object({
  departureDate: z.string().min(1, "Date is required"),
  departureCost: z.number().min(0, "Cost is required"),
  departureStatus: z.string().min(1, "Status is required"),
  departureNote: z.string().optional(),
});

const schema = z.object({ departures: z.array(rowSchema).min(1, "Add at least one departure") });

type FormValues = z.infer<typeof schema>;

interface DeparturesBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<CreateDeparturesBulkDto, "packageId">) => void;
  isLoading: boolean;
}

export function DeparturesBulkModal({ isOpen, onClose, onSubmit, isLoading }: DeparturesBulkModalProps) {
  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { departures: [{ departureDate: "", departureCost: 0, departureStatus: "", departureNote: "" }] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "departures" });

  const submit = (values: FormValues) => {
    onSubmit({
      departures: values.departures.map((d) => ({ ...d, departureNote: d.departureNote || undefined })),
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Add Departures"
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(submit)} isLoading={isLoading}>
            Add {fields.length} Departure{fields.length === 1 ? "" : "s"}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit(submit)}>
        <Repeater
          label="Departures"
          fields={fields}
          onAdd={() => append({ departureDate: "", departureCost: 0, departureStatus: "", departureNote: "" })}
          onRemove={remove}
          minRows={1}
          renderRow={(_field, index) => (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Date"
                type="date"
                required
                {...register(`departures.${index}.departureDate`)}
                error={errors.departures?.[index]?.departureDate?.message}
              />
              <Input
                label="Cost"
                type="number"
                step="0.01"
                required
                {...register(`departures.${index}.departureCost`, { valueAsNumber: true })}
                error={errors.departures?.[index]?.departureCost?.message}
              />
              <Input
                label="Status"
                required
                hint='e.g. "Guaranteed", "Open"'
                {...register(`departures.${index}.departureStatus`)}
                error={errors.departures?.[index]?.departureStatus?.message}
              />
              <Input label="Note" {...register(`departures.${index}.departureNote`)} />
            </div>
          )}
        />
      </form>
    </Modal>
  );
}
