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
import { Plus, KeyRound } from "lucide-react";

type AuthType = "api_key" | "oauth";

export function UpdateApiKeyDialog({
  employeeId,
  onUpdated,
  trigger,
}: {
  employeeId: string;
  onUpdated?: () => void | Promise<void>;
  trigger?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Lỗi cập nhật");
      setApiKey("");
      await onUpdated?.();
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
        {trigger ?? (
          <Button variant="secondary" size="sm">
            <KeyRound size={14} /> Cập nhật API key
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cập nhật WakaTime API key</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="newApiKey">WakaTime API Key mới</Label>
            <Input
              id="newApiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              required
              placeholder="waka_xxxxxxxx-xxxx-xxxx-..."
            />
            <p className="text-xs text-ink-500 mt-2">
              Hệ thống sẽ kiểm tra key với WakaTime trước khi lưu.
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

export function EmployeeFormDialog({
  onCreated,
}: {
  onCreated?: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [authType, setAuthType] = useState<AuthType>("api_key");
  const [apiKey, setApiKey] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const payload: Record<string, unknown> = { name, authType };
      if (authType === "api_key") payload.apiKey = apiKey;
      else {
        payload.clientId = clientId;
        payload.clientSecret = clientSecret;
      }
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Lỗi tạo");
      setName("");
      setApiKey("");
      setClientId("");
      setClientSecret("");
      await onCreated?.();
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
        <Button variant="primary" size="md">
          <Plus size={16} /> Thêm nhân sự
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm nhân sự</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="name">Tên</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <Label>Phương thức xác thực WakaTime</Label>
            <div className="flex gap-3">
              {(["api_key", "oauth"] as AuthType[]).map((t) => (
                <label
                  key={t}
                  className={
                    "flex-1 cursor-pointer border-2 rounded-sm px-3 py-2 text-sm text-center " +
                    (authType === t
                      ? "border-brand-blue bg-surface-cyan"
                      : "border-line-soft")
                  }
                >
                  <input
                    type="radio"
                    name="authType"
                    className="sr-only"
                    checked={authType === t}
                    onChange={() => setAuthType(t)}
                  />
                  {t === "api_key" ? "API Key" : "OAuth2"}
                </label>
              ))}
            </div>
          </div>
          {authType === "api_key" ? (
            <div>
              <Label htmlFor="apiKey">WakaTime API Key</Label>
              <Input
                id="apiKey"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                required
                placeholder="waka_xxxxxxxx-xxxx-xxxx-..."
              />
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="cid">Client ID</Label>
                <Input
                  id="cid"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cs">Client Secret</Label>
                <Input
                  id="cs"
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  required
                />
              </div>
              <p className="text-xs text-ink-500">
                Sau khi lưu, bạn cần bấm &quot;Authorize WakaTime&quot; trên
                trang chi tiết để hoàn tất uỷ quyền.
              </p>
            </>
          )}
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
              {busy ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
