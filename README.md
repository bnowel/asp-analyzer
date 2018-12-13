# ASP Analyzer

## Introduction

The simple act of including files in ASP can cause performance issues even if that code is never actually executed. This project helps to highlight all of the code that is included, and possibly double included within your ASP project.

## Getting Started

### Running the analyzer

#### Display help contents

    \> aa

#### Run basic scan of the current branch

cd to the directory of the branch to analyze
analysis results folder will be named in format yyyymd-Hms for execution time

    \> aa scan  

#### Compare branches

Runs scan on both branches, then compares analysis results in compare.csv.  Each branch analysis is also maintained within a folder named after the first 12 characters of the branch name.

    \> aa compare dev asp_lines_of_code_reduction

#### Output

analysis.csv

* num_refs = number of times file is referenced
* num_includes = number of includes used within file
* loc = lines of code within file (comments included)
* total_loc = total lines of code when all includes within file are unrolled
* optimal_loc = lines of code if each include were brought in exactly one time
* optimal_loc_delta = total_loc - optimal_loc
* bloat_factor = total_loc / optimal_loc; bigger value indicates using includes multiple times

## Random Stuff

When trying to find and replace to remove include statements here is a good regex: `<!--\s+#include\s+file\s*=\s*"([^"]+)"\s+-->\s*\n`
