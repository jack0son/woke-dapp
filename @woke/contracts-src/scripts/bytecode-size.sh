#!/bin/bash
grep \"bytecode\" build/contracts/artifacts/* | awk '{print $1 " " length($3)/2}'
