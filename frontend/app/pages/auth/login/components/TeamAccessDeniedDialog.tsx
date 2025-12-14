import { overlay } from "overlay-kit";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

type TeamAccessDeniedDialogProps = {
  isOpen: boolean;
  close: () => void;
};

function TeamAccessDeniedDialogContent({
  isOpen,
  close,
}: TeamAccessDeniedDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? close() : null)}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Team access required</DialogTitle>
          <DialogDescription>
            Your access to this team has not been approved yet, or you are not a
            member.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={close}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function openTeamAccessDeniedDialog(): Promise<void> {
  return overlay.openAsync<void>(({ isOpen, close }) => (
    <TeamAccessDeniedDialogContent isOpen={isOpen} close={() => close()} />
  ));
}


