"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface AdoConfigDialogProps {
  employeeId: string;
  currentConfig?: {
    organization?: string | null;
    project?: string | null;
    email?: string | null;
    enabled: boolean;
  };
  onConfigured?: () => void | Promise<void>;
}

export function AdoConfigDialog({
  employeeId,
  currentConfig,
  onConfigured,
}: AdoConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const [pat, setPat] = useState("");
  const [organization, setOrganization] = useState(currentConfig?.organization || "");
  const [project, setProject] = useState(currentConfig?.project || "");
  const [email, setEmail] = useState(currentConfig?.email || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    try {
      const payload = { pat, organization, project, email };
      const method = currentConfig?.enabled ? "PATCH" : "POST";

      const res = await fetch(`/api/employees/${employeeId}/ado`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Lỗi cấu hình Azure DevOps");
      }

      setPat("");
      setEmail("");
      await onConfigured?.();
      setOpen(false);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Plus size={14} /> Cấu hình Azure DevOps
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentConfig?.enabled
              ? "Cập nhật cấu hình Azure DevOps"
              : "Kết nối Azure DevOps"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="org">Organization</Label>
            <Input
              id="org"
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              required
              placeholder="myorg"
            />
            <p className="text-xs text-ink-500 mt-2">
              Tên organization từ URL:{" "}
              <span className="font-mono">dev.azure.com/myorg</span>
            </p>
          </div>
          <div>
            <Label htmlFor="proj">Project (tùy chọn)</Label>
            <Input
              id="proj"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="MyProject"
            />
          </div>
          <div>
            <Label htmlFor="email">Email ADO</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@example.com"
            />
            <p className="text-xs text-ink-500 mt-2">
              Email của nhân viên trong Azure DevOps để tìm work items được assign
            </p>
          </div>
          <div>
            <Label htmlFor="pat">Personal Access Token (PAT)</Label>
            <Input
              id="pat"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              required
              type="password"
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <p className="text-xs text-ink-500 mt-2">
              PAT cần có quyền{" "}
              <span className="font-mono">Work Items (Read &amp; Write)</span>
            </p>
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Đang kiểm tra..." : "Lưu"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AdoDisableButton({
  employeeId,
  onDisabled,
}: {
  employeeId: string;
  onDisabled?: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function disable() {
    if (!confirm("Bạn có chắc muốn ngắt kết nối Azure DevOps?")) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}/ado`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Lỗi ngắt kết nối");
      await onDisabled?.();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={disable} disabled={busy}>
      {busy ? "Đang ngắt..." : "Ngắt kết nối ADO"}
    </Button>
  );
}
