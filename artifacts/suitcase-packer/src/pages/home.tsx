import React, { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Box, Layers, Play, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { usePackItems } from "@workspace/api-client-react";

// --- Schemas ---
const dimensionSchema = z.object({
  width: z.coerce.number().int("Must be an integer").min(1, "Min 1").max(1000, "Max 1000"),
  breadth: z.coerce.number().int("Must be an integer").min(1, "Min 1").max(1000, "Max 1000"),
  height: z.coerce.number().int("Must be an integer").min(1, "Min 1").max(1000, "Max 1000"),
});

const formSchema = z.object({
  suitcase: dimensionSchema,
  items: z.array(dimensionSchema).min(1).max(20),
});

type FormValues = z.infer<typeof formSchema>;

export default function Home() {
  const { mutate, data: result, isPending, error } = usePackItems();
  const [itemCountInput, setItemCountInput] = useState("3");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      suitcase: { width: 20, breadth: 20, height: 20 },
      items: [
        { width: 5, breadth: 5, height: 5 },
        { width: 10, breadth: 5, height: 5 },
        { width: 4, breadth: 8, height: 2 },
      ],
    },
  });

  const { control, handleSubmit, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Only sync field array when user finishes typing (blur or Enter)
  const applyItemCount = (value: string) => {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 1 || n > 20) return;
    const current = fields.length;
    if (n > current) {
      for (let i = 0; i < n - current; i++) append({ width: 5, breadth: 5, height: 5 });
    } else if (n < current) {
      for (let i = current - 1; i >= n; i--) remove(i);
    }
  };

  const onSubmit = (data: FormValues) => {
    mutate({
      data: {
        suitcase: data.suitcase,
        items: data.items,
      },
    });
  };

  return (
    <div className="min-h-screen pb-24 relative">
      {/* Hero Background */}
      <div className="absolute top-0 left-0 right-0 h-96 overflow-hidden -z-10 bg-gradient-to-b from-primary/5 to-transparent">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
          alt="Abstract geometric blocks" 
          className="w-full h-full object-cover opacity-40 mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background"></div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <header className="mb-12 text-center md:text-left">
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-white shadow-lg shadow-primary/10 border border-primary/10">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-display">
            Suitcase Packing Solver
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Configure your suitcase dimensions and items below. Our 3D backtracking algorithm will compute the optimal arrangement to maximize the number of packed items.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* LEFT COLUMN: FORM */}
          <div className="lg:col-span-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 relative">
              
              {/* Suitcase Section */}
              <section className="bg-card rounded-3xl p-6 shadow-xl shadow-black/5 border border-border/50 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-primary/80" />
                <h2 className="text-xl font-display font-semibold mb-6 flex items-center gap-2">
                  <Box className="w-5 h-5 text-primary" />
                  Suitcase Dimensions
                </h2>
                
                <div className="grid grid-cols-3 gap-4">
                  <DimensionField control={control} name="suitcase.width" label="Width" />
                  <DimensionField control={control} name="suitcase.breadth" label="Breadth" />
                  <DimensionField control={control} name="suitcase.height" label="Height" />
                </div>
              </section>

              {/* Items Configuration Section */}
              <section className="bg-card rounded-3xl p-6 shadow-xl shadow-black/5 border border-border/50">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-display font-semibold flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    Items Configuration
                  </h2>
                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={itemCountInput}
                      onChange={(e) => setItemCountInput(e.target.value)}
                      onBlur={(e) => applyItemCount(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyItemCount(itemCountInput); } }}
                      className="w-full bg-secondary/50 border-2 px-3 py-1.5 rounded-xl text-center font-medium focus:outline-none focus:ring-4 transition-all border-transparent focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <AnimatePresence initial={false}>
                    {fields.map((field, index) => (
                      <motion.div
                        key={field.id}
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: "auto", y: 0 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="p-4 rounded-2xl bg-secondary/30 border border-secondary"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 font-medium text-sm text-muted-foreground">
                            Item {index + 1}
                          </div>
                          <div className="flex-1 grid grid-cols-3 gap-3">
                            <InlineDimension control={control} name={`items.${index}.width`} placeholder="W" />
                            <InlineDimension control={control} name={`items.${index}.breadth`} placeholder="B" />
                            <InlineDimension control={control} name={`items.${index}.height`} placeholder="H" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </section>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isPending}
                className={`
                  w-full py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-2
                  shadow-lg transition-all duration-300 transform
                  ${isPending 
                    ? "bg-muted text-muted-foreground cursor-not-allowed shadow-none" 
                    : "bg-gradient-to-r from-primary to-blue-600 text-white hover:shadow-primary/25 hover:-translate-y-1 hover:shadow-xl active:translate-y-0"
                  }
                `}
              >
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Computing...
                  </div>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    Pack Items
                  </>
                )}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: RESULTS */}
          <div className="lg:col-span-7">
            <div className="sticky top-8">
              {isPending ? (
                <ResultSkeleton />
              ) : error ? (
                <div className="bg-destructive/5 border border-destructive/20 rounded-3xl p-8 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                  <h3 className="text-xl font-bold text-destructive mb-2">Error Computing Packing</h3>
                  <p className="text-destructive/80">{(error as any)?.response?.data?.error || "An unexpected error occurred while communicating with the server."}</p>
                </div>
              ) : result ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-3xl shadow-xl shadow-black/5 border border-border/50 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-primary/5 to-transparent p-6 sm:p-8 border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-display font-bold text-foreground">Packing Results</h2>
                      <p className="text-muted-foreground mt-1">Algorithm completed successfully.</p>
                    </div>
                    <div className="px-5 py-3 rounded-2xl bg-white shadow-sm border border-primary/10 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Packed</div>
                        <div className="text-xl font-bold text-foreground leading-none">{result.maxItemsPacked} <span className="text-sm font-normal text-muted-foreground">/ {fields.length}</span></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 sm:p-8 bg-secondary/10">
                    {result.maxItemsPacked === 0 ? (
                      <div className="text-center py-12">
                        <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-semibold text-foreground">No Items Packed</h3>
                        <p className="text-muted-foreground mt-2">None of the items could fit within the specified suitcase dimensions.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {result.packedItems.map((item, idx) => (
                          <motion.div 
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white p-5 rounded-2xl border border-border shadow-sm flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-primary font-bold">
                                #{item.itemIndex}
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground">Item {item.itemIndex}</h4>
                                <p className="text-sm text-muted-foreground">Successfully placed</p>
                              </div>
                            </div>
                            
                            <div className="flex gap-6 text-sm">
                              <div>
                                <div className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wider">Front-Left-Bottom</div>
                                <div className="font-mono bg-secondary/50 px-2 py-1 rounded-md text-foreground">
                                  ({item.bottomFrontLeft.join(', ')})
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground mb-1 text-xs font-medium uppercase tracking-wider">Back-Right-Top</div>
                                <div className="font-mono bg-secondary/50 px-2 py-1 rounded-md text-foreground">
                                  ({item.topBackRight.join(', ')})
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="h-full min-h-[400px] border-2 border-dashed border-border rounded-3xl flex flex-col items-center justify-center text-center p-8 bg-secondary/20">
                  <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
                    <Box className="w-8 h-8 text-primary/40" />
                  </div>
                  <h3 className="text-xl font-display font-semibold text-foreground mb-2">Ready to Pack</h3>
                  <p className="text-muted-foreground max-w-sm">Enter your dimensions on the left and click "Pack Items" to see the visual coordinates of the optimal arrangement.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// --- Helper Components ---

function DimensionField({ control, name, label }: { control: any, name: string, label: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-600">{label}</label>
          <div className="relative">
            <input
              {...field}
              type="number"
              className={`w-full bg-background border-2 px-4 py-3 rounded-xl transition-all outline-none text-foreground
                ${error 
                  ? "border-destructive focus:ring-4 focus:ring-destructive/10" 
                  : "border-border focus:border-primary focus:ring-4 focus:ring-primary/10"
                }
              `}
              placeholder="0"
            />
          </div>
        </div>
      )}
    />
  );
}

function InlineDimension({ control, name, placeholder }: { control: any, name: string, placeholder: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <div className="relative group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground group-focus-within:text-primary transition-colors">
            {placeholder}
          </span>
          <input
            {...field}
            type="number"
            className={`w-full bg-background border px-3 py-2 pl-8 rounded-lg transition-all outline-none text-sm text-foreground
              ${error 
                ? "border-destructive focus:ring-2 focus:ring-destructive/20" 
                : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
              }
            `}
          />
        </div>
      )}
    />
  );
}

function ResultSkeleton() {
  return (
    <div className="bg-card rounded-3xl shadow-xl shadow-black/5 border border-border/50 overflow-hidden animate-pulse">
      <div className="p-8 border-b border-border/50 flex justify-between items-center">
        <div className="space-y-3">
          <div className="h-8 w-48 bg-secondary rounded-lg"></div>
          <div className="h-4 w-32 bg-secondary rounded-md"></div>
        </div>
        <div className="h-16 w-32 bg-secondary rounded-2xl"></div>
      </div>
      <div className="p-8 space-y-4 bg-secondary/5">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 w-full bg-white rounded-2xl border border-border/50"></div>
        ))}
      </div>
    </div>
  );
}
