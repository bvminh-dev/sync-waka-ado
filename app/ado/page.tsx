"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input, Label } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, ChevronRight, Trash2, X, AlertTriangle } from "lucide-react";

const COMMON_WORK_ITEM_TYPES = [
  "User Story",
  "Task",
  "Feature",
  "Bug",
  "Tech Debt",
  "Epic",
];

interface AdoEmployeeRow {
  _id: string;
  name: string;
  adoEnabled: boolean;
  adoOrganization: string | null;
  adoProject: string | null;
}

function CreateAdoEmployeeDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [project, setProject] = useState("");
  const [email, setEmail] = useState("");
  const [pat, setPat] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
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

  function resetForm() {
    setName("");
    setOrganization("");
    setProject("");
    setEmail("");
    setPat("");
    setSelectedTypes([]);
    setCustomType("");
    setErr(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);

    let createdId: string | null = null;
    try {
      // Step 1: create employee with just name
      const empRes = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!empRes.ok) {
        const data = await empRes.json().catch(() => ({}));
        throw new Error(data.error || "Lỗi tạo nhân viên");
      }
      const empData = await empRes.json();
      createdId = empData._id as string;

      // Step 2: save ADO config (validates PAT against Azure DevOps)
      const adoRes = await fetch(`/api/employees/${createdId}/ado`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pat,
          organization,
          project,
          email,
          workItemTypes: selectedTypes,
        }),
      });
      if (!adoRes.ok) {
        const data = await adoRes.json().catch(() => ({}));
        throw new Error(data.error || "Lỗi cấu hình Azure DevOps");
      }

      resetForm();
      setOpen(false);
      onCreated();
    } catch (e: unknown) {
      // Rollback: delete the just-created employee if step 2 failed
      if (createdId) {
        await fetch(`/api/employees/${createdId}`, { method: "DELETE" }).catch(
          () => {},
        );
      }
      setErr(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setBusy(false);
    }
  }

  const customTypes = selectedTypes.filter(
    (t) => !COMMON_WORK_ITEM_TYPES.includes(t),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="primary" size="sm">
          <Plus size={14} /> Thêm nhân viên ADO
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm nhân viên ADO</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tên nhân viên</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nguyễn Văn A"
            />
          </div>
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
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Huỷ
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Đang tạo..." : "Tạo"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdoEmployeesPage() {
  const [list, setList] = useState<AdoEmployeeRow[] | null>(null);

  async function load() {
    const res = await fetch("/api/employees");
    const d = await res.json();
    setList(d.employees);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Xoá nhân viên này? Mọi dữ liệu liên quan cũng bị xoá.")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl sm:text-5xl font-semibold text-primary-dark">
          ADO
        </h1>
        <CreateAdoEmployeeDialog onCreated={load} />
      </div>

      {!list ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : list.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center text-ink-400 py-10">
              Chưa có nhân viên nào dùng Azure DevOps. Bấm{" "}
              <strong>&quot;Thêm nhân viên ADO&quot;</strong> để bắt đầu.
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((e) => (
            <Card key={e._id} className="hover:shadow-cardHover transition">
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-lg text-primary-dark truncate">
                      {e.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {e.adoEnabled && e.adoOrganization ? (
                        <Badge className="bg-blue-100 text-blue-700">
                          {e.adoOrganization}
                          {e.adoProject ? ` / ${e.adoProject}` : ""}
                        </Badge>
                      ) : (
                        <Badge className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertTriangle size={12} /> Chưa cấu hình ADO
                        </Badge>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => remove(e._id)}
                    className="text-ink-400 hover:text-red-600 p-1 shrink-0"
                    aria-label="Xoá"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/employees/${e._id}/ado`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                      Quản lý tickets <ChevronRight size={14} />
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
