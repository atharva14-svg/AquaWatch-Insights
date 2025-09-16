'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sparkles, Mic, Loader2, Bot, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { waterDataAgent } from '@/ai/flows/water-data-agent';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { RetellClient } from 'retell-sdk';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

const retell = new RetellClient();

export default function AiAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [transcript, setTranscript] = useState('');
    const { toast } = useToast();
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
            const recognition = new webkitSpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = 'hi-IN';

            recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                setTranscript(finalTranscript + interimTranscript);
            };
            
            recognition.onend = () => {
                setIsListening(false);
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                toast({
                    variant: 'destructive',
                    title: 'Speech Recognition Error',
                    description: 'Could not start speech recognition.',
                });
                setIsListening(false);
            };
            
            recognitionRef.current = recognition;
        }
    }, [toast]);
    
    const toggleListening = () => {
        if (!recognitionRef.current) {
            toast({
                variant: 'destructive',
                title: 'Browser Not Supported',
                description: 'Speech recognition is not supported in this browser.',
            });
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
            if (transcript.trim()) {
                handleSend(transcript.trim());
            }
        } else {
            setTranscript('');
            recognitionRef.current.start();
        }
        setIsListening(!isListening);
    };

    const speak = (text: string) => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'hi-IN';
            window.speechSynthesis.speak(utterance);
        }
    };
    
    const handleSend = async (query: string) => {
        if (!query.trim()) return;

        const newMessages: Message[] = [...messages, { role: 'user', content: query }];
        setMessages(newMessages);
        setIsLoading(true);
        setTranscript('');

        try {
            const result = await waterDataAgent({ query });
            setMessages([...newMessages, { role: 'assistant', content: result.answer }]);
            speak(result.answer);
        } catch (error) {
            console.error('AI agent failed:', error);
            const errorMessage = 'माफ़ कीजिए, मुझे जवाब मिलने में कठिनाई हुई। कृपया पुनः प्रयास करें।';
            setMessages([...newMessages, { role: 'assistant', content: errorMessage }]);
            toast({
                variant: 'destructive',
                title: 'AI Agent Error',
                description: 'Could not get a response from the AI agent.',
            });
            speak(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setMessages([]);
            setTranscript('');
            if (isListening) {
                recognitionRef.current?.stop();
                setIsListening(false);
            }
            window.speechSynthesis?.cancel();
        }
    }

    return (
        <>
            <Button
                onClick={() => handleOpenChange(true)}
                className="fixed bottom-8 right-8 rounded-full w-16 h-16 shadow-lg z-50"
            >
                <Sparkles className="h-8 w-8" />
            </Button>
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[425px] md:max-w-[600px] flex flex-col h-[70vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bot /> AI Assistant
                        </DialogTitle>
                        <DialogDescription>
                            Ask me about groundwater levels. Click the mic to use your voice.
                        </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="flex-1 -mx-6 px-6">
                        <div className="space-y-4 pr-4">
                            {messages.map((message, index) => (
                                <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? "justify-end" : "justify-start")}>
                                     {message.role === 'assistant' && <Bot className="h-6 w-6 text-primary flex-shrink-0" />}
                                    <div className={cn("p-3 rounded-lg max-w-[80%]", message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                                        <p className="text-sm">{message.content}</p>
                                    </div>
                                    {message.role === 'user' && <User className="h-6 w-6 text-muted-foreground flex-shrink-0" />}
                                </div>
                            ))}
                             {isLoading && (
                                <div className="flex items-start gap-3 justify-start">
                                    <Bot className="h-6 w-6 text-primary flex-shrink-0" />
                                    <div className="p-3 rounded-lg bg-muted">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                    <DialogFooter className="mt-auto !justify-center">
                        <div className='w-full relative'>
                            <textarea
                                value={transcript}
                                onChange={(e) => setTranscript(e.target.value)}
                                placeholder={isListening ? 'सुन रहा है...' : 'एक सवाल पूछो...'}
                                className="w-full border rounded-full p-3 pl-4 pr-20 min-h-[50px] max-h-[150px] resize-none"
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend(transcript);
                                    }
                                }}
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <Button
                                    type="button"
                                    size="icon"
                                    variant={isListening ? 'destructive' : 'default'}
                                    onClick={toggleListening}
                                    className="rounded-full"
                                >
                                    <Mic className="h-5 w-5" />
                                </Button>
                                <Button
                                    type="button"
                                    onClick={() => handleSend(transcript)}
                                    className="rounded-full"
                                    disabled={isLoading || !transcript.trim()}
                                >
                                    Send
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
