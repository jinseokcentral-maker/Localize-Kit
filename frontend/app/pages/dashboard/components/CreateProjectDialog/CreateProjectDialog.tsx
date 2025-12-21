import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react";
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Badge } from "~/components/ui/badge";

import { LANGUAGES } from "./constants";
import { createProjectSchema, type CreateProjectFormValues } from "./schema";
import { generateSlug } from "./utils";
import { useCreateProject } from "~/hooks/query/useCreateProject";
import { useQueryClient } from "@tanstack/react-query";
import type { ProjectProject } from "~/api/types.gen";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { getErrorMessage } from "~/lib/api/apiWrapper";

interface CreateProjectDialogContentProps {
  isOpen: boolean;
  close: (result?: ProjectProject) => void;
}

function CreateProjectDialogContent({
  isOpen,
  close,
}: CreateProjectDialogContentProps) {
  const form = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      description: "",
      slug: "",
      defaultLanguage: "en",
      languages: ["en"],
    },
  });

  const defaultLanguage = form.watch("defaultLanguage");
  const selectedLanguages = form.watch("languages");
  const [languagePopoverOpen, setLanguagePopoverOpen] = useState(false);
  const createProjectMutation = useCreateProject();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  function handleNameChange(value: string) {
    form.setValue("name", value);
    // Auto-generate slug only if slug field hasn't been manually edited
    if (value && !form.getFieldState("slug").isDirty) {
      form.setValue("slug", generateSlug(value), { shouldDirty: false });
    }
  }

  function handleDefaultLanguageChange(value: string) {
    form.setValue("defaultLanguage", value);
    // Ensure default language is always in languages list
    const currentLanguages = form.getValues("languages");
    if (value && !currentLanguages.includes(value)) {
      form.setValue("languages", [...currentLanguages, value]);
    }
  }

  async function onSubmit(values: CreateProjectFormValues) {
    try {
      const result = await createProjectMutation.mutateAsync({
        name: values.name,
        description: values.description,
        slug: values.slug,
        defaultLanguage: values.defaultLanguage,
        languages: values.languages,
      });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created successfully");
      navigate(`/dashboard/projects/${result.id}`);
      close(result);
    } catch (error) {
      console.error("Failed to create project:", error);
      const errorMessage = getErrorMessage(error, "Failed to create project");
      toast.error(errorMessage);
    }
  }

  function handleCancel() {
    close();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            Add a new localization project to your workspace.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Marketing Website"
                      {...field}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                        /
                      </span>
                      <Input
                        className="pl-6"
                        placeholder="marketing-website"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    URL-friendly identifier for your project.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of this project..."
                      className="resize-none h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="defaultLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Language</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleDefaultLanguageChange(value);
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            <span className="mr-2">{lang.flag}</span>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="languages"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="mb-1">Target Languages</FormLabel>
                    <Popover
                      open={languagePopoverOpen}
                      onOpenChange={setLanguagePopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={`w-full justify-between ${
                              !field.value || field.value.length === 0
                                ? "text-muted-foreground"
                                : ""
                            }`}
                          >
                            {field.value && field.value.length > 0
                              ? `${field.value.length} selected`
                              : "Select languages"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[200px] p-0 max-h-[300px] overflow-hidden"
                        align="start"
                      >
                        <Command className="h-full">
                          <CommandInput placeholder="Search language..." />
                          <CommandList className="max-h-[250px]">
                            <CommandEmpty>No language found.</CommandEmpty>
                            <CommandGroup>
                              {LANGUAGES.map((language) => (
                                <CommandItem
                                  value={language.label}
                                  key={language.value}
                                  onSelect={() => {
                                    const current = new Set(field.value);
                                    if (current.has(language.value)) {
                                      // Prevent removing default language
                                      if (language.value !== defaultLanguage) {
                                        current.delete(language.value);
                                      }
                                    } else {
                                      current.add(language.value);
                                    }
                                    field.onChange(Array.from(current));
                                  }}
                                >
                                  <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary">
                                    <Check
                                      className={
                                        field.value?.includes(language.value)
                                          ? "opacity-100"
                                          : "opacity-0"
                                      }
                                    />
                                  </div>
                                  <span className="mr-2">{language.flag}</span>
                                  {language.label}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Selected Languages Badges */}
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedLanguages.map((langCode) => {
                const lang = LANGUAGES.find((l) => l.value === langCode);
                if (!lang) return null;
                return (
                  <Badge
                    key={langCode}
                    variant="secondary"
                    className="pl-1 pr-2 py-0.5 h-7"
                  >
                    <span className="mr-1.5 text-base">{lang.flag}</span>
                    {lang.label}
                    {langCode !== defaultLanguage && (
                      <button
                        type="button"
                        className="ml-1.5 text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          const newVal = selectedLanguages.filter(
                            (l) => l !== langCode
                          );
                          form.setValue("languages", newVal);
                        }}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </Badge>
                );
              })}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={createProjectMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  !form.formState.isValid || createProjectMutation.isPending
                }
              >
                {createProjectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Project"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Open create project dialog using overlay-kit
 * Returns a promise that resolves with form values if user submits, or undefined if cancelled
 */
export function openCreateProjectDialog(): Promise<ProjectProject | undefined> {
  return overlay.openAsync<ProjectProject | undefined>(({ isOpen, close }) => {
    return (
      <CreateProjectDialogContent
        isOpen={isOpen}
        close={(result) => close(result)}
      />
    );
  });
}
