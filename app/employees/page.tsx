"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeFormDialog } from "@/components/EmployeeForm";
import { Trash2, ChevronRight, AlertTriangle } from "lucide-react";

interface EmpRow {
  _id: string;
  name: string;
  authType: "api_key" | "oauth" | null;
  oauthAuthorized: boolean;
  createdAt: string;
}

export default function EmployeesPage() {
  const router = useRouter();
  const [list, setList] = useState<EmpRow[] | null>(null);

  async function load() {
    const res = await fetch("/api/employees");
    const d = await res.json();
    setList(d.employees);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Xoá nhân sự này? Lịch sử cache cũng bị xoá.")) return;
    await fetch(`/api/employees/${id}`, { method: "DELETE" });
    router.refresh();
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl sm:text-5xl font-semibold text-primary-dark">
          Nhân sự
        </h1>
        <EmployeeFormDialog onCreated={load} />
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
              Chưa có nhân sự nào. Bấm <strong>“Thêm nhân sự”</strong> để bắt
              đầu.
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((e) => (
            <Card key={e._id} className="hover:shadow-cardHover transition">
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-lg text-primary-dark">
                      {e.name}
                    </h3>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {e.authType === null ? (
                        <Badge className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200">
                          <AlertTriangle size={12} /> Chưa cấu hình WakaTime
                        </Badge>
                      ) : (
                        <>
                          <Badge>
                            {e.authType === "api_key" ? "API Key" : "OAuth2"}
                          </Badge>
                          {e.authType === "oauth" && (
                            <Badge
                              className={
                                e.oauthAuthorized
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }
                            >
                              {e.oauthAuthorized
                                ? "Đã uỷ quyền"
                                : "Chưa uỷ quyền"}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => remove(e._id)}
                    className="text-ink-400 hover:text-red-600 p-1"
                    aria-label="Xoá"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href={`/employees/${e._id}`} className="flex-1">
                    <Button variant="secondary" size="sm" className="w-full">
                      Xem dashboard <ChevronRight size={14} />
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
