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
import { Plus, Unplug, X } from "lucide-react";

const COMMON_WORK_ITEM_TYPES = [
  "User Story",
  "Task",
  "Feature",
  "Bug",
  "Tech Debt",
  "Epic",
];

interface AdoConfigDialogProps {
  employeeId: string;
  currentConfig?: {
    organization?: string | null;
    project?: string | null;
    email?: string | null;
    enabled: boolean;
    workItemTypes?: string[];
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
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    currentConfig?.workItemTypes || [],
  );
  const [customType, setCustomType] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toggleType(t: string) {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  }

  function addCustomType() {
    const v = customType.trim();
    if (!v) return;
    setSelectedTypes((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setCustomType("");
  }

  function removeType(t: string) {
    setSelectedTypes((prev) => prev.filter((x) => x !== t));
  }

  const customTypes = selectedTypes.filter(
    (t) => !COMMON_WORK_ITEM_TYPES.includes(t),
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    try {
      const payload: Record<string, unknown> = {
        organization,
        project,
        email,
        workItemTypes: selectedTypes,
      };
      if (pat.trim()) payload.pat = pat;
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
          <Plus size={14} />
          <span className="hidden sm:inline">
            {currentConfig?.enabled ? "Cấu hình" : "Cấu hình Azure DevOps"}
          </span>
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
              required={!currentConfig?.enabled}
              type="password"
              placeholder={
                currentConfig?.enabled
                  ? "Để trống = giữ PAT hiện tại"
                  : "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              }
            />
            <p className="text-xs text-ink-500 mt-2">
              PAT cần có quyền{" "}
              <span className="font-mono">Work Items (Read &amp; Write)</span>
              {currentConfig?.enabled && (
                <span> &middot; Để trống nếu không muốn thay đổi.</span>
              )}
            </p>
          </div>
          <div>
            <Label>Loại work item</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {COMMON_WORK_ITEM_TYPES.map((t) => {
                const checked = selectedTypes.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      checked
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            {customTypes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {customTypes.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-700 border border-purple-200"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeType(t)}
                      className="hover:text-purple-900"
                      aria-label={`Bỏ ${t}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <Input
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomType();
                  }
                }}
                placeholder="Loại khác (vd: Spike)"
              />
              <Button type="button" variant="secondary" onClick={addCustomType}>
                Thêm
              </Button>
            </div>
            <p className="text-xs text-ink-500 mt-2">
              Để trống = lấy tất cả loại ticket
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
      <Unplug size={14} />
      <span className="hidden sm:inline">
        {busy ? "Đang ngắt..." : "Ngắt kết nối ADO"}
      </span>
    </Button>
  );
}
