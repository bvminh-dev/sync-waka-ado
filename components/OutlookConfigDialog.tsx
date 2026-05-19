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
import { CalendarPlus, Unplug } from "lucide-react";

export interface OutlookStatus {
  outlookEnabled: boolean;
  outlookAuthType: "global" | "custom" | null;
  hasCustomCreds: boolean;
  outlookEmail: string | null;
  outlookTenantId: string | null;
  oauthAuthorized: boolean;
  tokenExpiresAt: string | null;
}

interface Props {
  employeeId: string;
  status?: OutlookStatus | null;
  onSaved?: () => void | Promise<void>;
}

export function OutlookConfigDialog({ employeeId, status, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [authType, setAuthType] = useState<"global" | "custom">(
    status?.outlookAuthType === "custom" ? "custom" : "global",
  );
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [tenantId, setTenantId] = useState(status?.outlookTenantId ?? "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const payload: Record<string, unknown> = { authType };
      if (authType === "custom") {
        if (clientId.trim()) payload.clientId = clientId.trim();
        if (clientSecret.trim()) payload.clientSecret = clientSecret.trim();
        payload.tenantId = tenantId.trim() || null;
      }
      const method = status?.outlookEnabled ? "PATCH" : "POST";
      const res = await fetch(`/api/employees/${employeeId}/outlook`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Lỗi cấu hình Outlook");
      }
      setClientSecret("");
      await onSaved?.();
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
          <CalendarPlus size={14} />
          <span className="hidden sm:inline">
            {status?.outlookEnabled ? "Cấu hình Outlook" : "Kết nối Outlook"}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {status?.outlookEnabled
              ? "Cập nhật cấu hình Outlook Calendar"
              : "Kết nối Outlook Calendar"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>Loại OAuth app</Label>
            <div className="flex flex-col gap-2">
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="authType"
                  checked={authType === "global"}
                  onChange={() => setAuthType("global")}
                  className="mt-1"
                />
                <span>
                  <span className="font-semibold">Dùng app dùng chung</span>{" "}
                  <span className="text-ink-500">
                    (Azure AD app cấu hình trong env)
                  </span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="radio"
                  name="authType"
                  checked={authType === "custom"}
                  onChange={() => setAuthType("custom")}
                  className="mt-1"
                />
                <span>
                  <span className="font-semibold">App riêng</span>{" "}
                  <span className="text-ink-500">
                    (nhập Client ID / Secret / Tenant ID riêng)
                  </span>
                </span>
              </label>
            </div>
          </div>

          {authType === "custom" && (
            <>
              <div>
                <Label htmlFor="ms-cid">Client ID</Label>
                <Input
                  id="ms-cid"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder={
                    status?.hasCustomCreds
                      ? "Để trống = giữ Client ID hiện tại"
                      : "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  }
                />
              </div>
              <div>
                <Label htmlFor="ms-secret">Client Secret</Label>
                <Input
                  id="ms-secret"
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder={
                    status?.hasCustomCreds
                      ? "Để trống = giữ Secret hiện tại"
                      : "secret value"
                  }
                />
              </div>
              <div>
                <Label htmlFor="ms-tenant">Tenant ID (tùy chọn)</Label>
                <Input
                  id="ms-tenant"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="common, organizations, hoặc tenant id cụ thể"
                />
              </div>
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
          <p className="text-xs text-ink-500 pt-1">
            Sau khi lưu, bấm <span className="font-semibold">Authorize Outlook</span>{" "}
            để đăng nhập Microsoft và cấp quyền đọc lịch.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function OutlookDisconnectButton({
  employeeId,
  onDone,
}: {
  employeeId: string;
  onDone?: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  async function run() {
    if (!confirm("Ngắt kết nối Outlook? Cache events sẽ bị xoá."))
      return;
    setBusy(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}/outlook`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Lỗi ngắt kết nối");
      await onDone?.();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Lỗi không xác định");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Button variant="ghost" size="sm" onClick={run} disabled={busy}>
      <Unplug size={14} />
      <span className="hidden sm:inline">
        {busy ? "Đang ngắt..." : "Ngắt Outlook"}
      </span>
    </Button>
  );
}
